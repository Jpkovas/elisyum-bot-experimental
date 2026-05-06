import { colorText, showConsoleError } from '../utils/general.util.js'
import { hashForLog } from '../utils/privacy.util.js'

export type NewsletterUpdate = {
    id?: string
    operation?: string
    data?: unknown
}

export async function logNewslettersUpdate(updates: NewsletterUpdate[]) {
    try {
        if (!Array.isArray(updates) || !updates.length) return

        for (const update of updates) {
            const id = update.id || 'unknown'
            const op = update.operation || 'update'

            console.log(
                colorText('[NEWSLETTER-META]', '#9c88ff'),
                colorText(hashForLog(id) || 'unknown', '#44bd32'),
                colorText(op, '#e84118'),
                update.data ? colorText('metadata_present=true', '#40739e') : ''
            )
        }
    } catch (err: any) {
        showConsoleError(err, 'NEWSLETTERS-UPDATE')
    }
}
