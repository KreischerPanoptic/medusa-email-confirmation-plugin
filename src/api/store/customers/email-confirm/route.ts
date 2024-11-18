import { 
    MedusaRequest, 
    MedusaResponse
} from "@medusajs/medusa"
import EmailConfirmationService from "src/services/email-confirmation"
import { APIResponse, TokenRequestViewModel } from "src/views"

export const POST = async (
    req: MedusaRequest<TokenRequestViewModel>,
    res: MedusaResponse<APIResponse<never>>
) => {
    const emailConfirmationService: EmailConfirmationService = req.scope.resolve(
        "emailConfirmationService"
     )
     res.json(await emailConfirmationService.confirm(req.body.email, req.body.token))
}