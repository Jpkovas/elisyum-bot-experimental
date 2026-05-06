#!/usr/bin/env bun
// Webhook server para deploy automatico
import { createServer } from 'http';
import { spawn } from 'child_process';
import { createHmac, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';

const DEFAULT_PORT = 3001;
const DEFAULT_DEPLOY_PATH = '/root/elisyum-bot';
const DEFAULT_BUN_BIN = '/root/.bun/bin/bun';
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parsePort(value) {
  const port = Number(value || DEFAULT_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('WEBHOOK_PORT must be a valid TCP port');
  }
  return port;
}

function parseMaxBodyBytes(value) {
  const maxBytes = Number(value || DEFAULT_MAX_BODY_BYTES);
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('WEBHOOK_MAX_BODY_BYTES must be a positive integer');
  }
  return maxBytes;
}

function getDeployPath() {
  const configuredPath = process.env.DEPLOY_PATH || DEFAULT_DEPLOY_PATH;
  if (!path.isAbsolute(configuredPath)) {
    throw new Error('DEPLOY_PATH must be absolute');
  }
  return path.resolve(configuredPath);
}

export function verifyGitHubSignature(signatureHeader, secret, body) {
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`);
  const received = Buffer.from(signature);

  return received.length === expected.length && timingSafeEqual(received, expected);
}

function readBody(req, maxBodyBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let rejected = false;

    req.on('data', chunk => {
      if (rejected) {
        return;
      }

      totalBytes += chunk.length;
      if (totalBytes > maxBodyBytes) {
        rejected = true;
        const error = new Error('Payload too large');
        error.statusCode = 413;
        reject(error);
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      if (!rejected) {
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });

    req.on('error', error => {
      if (!rejected) {
        reject(error);
      }
    });
  });
}

function runStep(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false });
    const stdout = [];
    const stderr = [];

    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', code => {
      const output = Buffer.concat(stdout).toString('utf8');
      const errorOutput = Buffer.concat(stderr).toString('utf8');

      if (code !== 0) {
        const error = new Error(`${command} ${args.join(' ')} failed with exit code ${code}`);
        error.stdout = output;
        error.stderr = errorOutput;
        reject(error);
        return;
      }

      if (output) console.log(output.trim());
      if (errorOutput) console.error(errorOutput.trim());
      resolve({ stdout: output, stderr: errorOutput });
    });
  });
}

async function runDeploy(deployPath, bunBin) {
  await runStep('git', ['pull', 'origin', 'main'], deployPath);
  await runStep(bunBin, ['install', '--frozen-lockfile'], deployPath);
  const beforePreflight = await runStep(bunBin, ['run', 'preflight:storage'], deployPath);
  fs.writeFileSync(path.join(deployPath, 'storage-preflight.before.json'), beforePreflight.stdout);
  await runStep(bunBin, ['run', 'build'], deployPath);
  const afterPreflight = await runStep(bunBin, ['run', 'preflight:storage'], deployPath);
  fs.writeFileSync(path.join(deployPath, 'storage-preflight.after.json'), afterPreflight.stdout);
  await runStep('systemctl', ['restart', 'lbot'], deployPath);
}

export function createWebhookHandler({ secret, deployPath, bunBin, maxBodyBytes }) {
  return async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    try {
      const body = await readBody(req, maxBodyBytes);
      if (!verifyGitHubSignature(req.headers['x-hub-signature-256'], secret, body)) {
        console.error('Invalid webhook signature');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      const payload = JSON.parse(body);
      if (payload.ref !== 'refs/heads/main') {
        console.log(`Ignoring push to ${payload.ref}`);
        res.writeHead(200);
        res.end('OK - Ignored');
        return;
      }

      console.log('Deploy triggered');
      res.writeHead(200);
      res.end('OK - Deploying');

      runDeploy(deployPath, bunBin).then(() => {
        console.log('Deploy completed');
      }).catch(error => {
        console.error('Deploy failed:', error.message);
        if (error.stderr) console.error(error.stderr);
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      console.error('Webhook error:', error.message);
      res.writeHead(statusCode);
      res.end(statusCode === 413 ? 'Payload Too Large' : 'Internal Server Error');
    }
  };
}

export function startWebhookServer() {
  const port = parsePort(process.env.WEBHOOK_PORT);
  const secret = requiredEnv('WEBHOOK_SECRET');
  const deployPath = getDeployPath();
  const bunBin = process.env.BUN_BIN || DEFAULT_BUN_BIN;
  const maxBodyBytes = parseMaxBodyBytes(process.env.WEBHOOK_MAX_BODY_BYTES);

  const server = createServer(createWebhookHandler({ secret, deployPath, bunBin, maxBodyBytes }));
  server.listen(port, () => {
    console.log('Webhook Deploy Server');
    console.log(`Port: ${port}`);
    console.log(`Path: ${deployPath}`);
    console.log(`Max body: ${maxBodyBytes} bytes`);
  });
  return server;
}

if (import.meta.main) {
  try {
    startWebhookServer();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
