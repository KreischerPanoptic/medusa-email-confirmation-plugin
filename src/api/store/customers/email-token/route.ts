import { 
    MedusaRequest, 
    MedusaResponse,
} from "@medusajs/medusa"
import EmailConfirmationService from "src/services/email-confirmation"
import { APIResponse, EmailRequestViewModel } from "src/views"

export const POST = async (
    req: MedusaRequest<EmailRequestViewModel>,
    res: MedusaResponse<APIResponse<never>>
) => {
    const emailConfirmationService: EmailConfirmationService = req.scope.resolve(
        "emailConfirmationService"
     )
     res.json(await emailConfirmationService.tokenRequest(req.body.email))
}