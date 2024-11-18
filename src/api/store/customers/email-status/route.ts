import { 
    MedusaRequest, 
    MedusaResponse
} from "@medusajs/medusa"
import EmailConfirmationService from "src/services/email-confirmation"
import { APIResponse, EmailRequestViewModel, StatusResponseViewModel } from "src/views"

export const POST = async (
    req: MedusaRequest<EmailRequestViewModel>,
    res: MedusaResponse<APIResponse<StatusResponseViewModel>>
) => {
    const emailConfirmationService: EmailConfirmationService = req.scope.resolve(
        "emailConfirmationService"
     )
     res.json(await emailConfirmationService.status(req.body.email))
}