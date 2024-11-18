import { 
    MedusaRequest, 
    MedusaResponse,
} from "@medusajs/medusa"
import EmailConfirmationService from "../../../../services/email-confirmation"
import { APIResponse, EmailRequestViewModel } from "../../../index"
export const POST = async (
    req: MedusaRequest<EmailRequestViewModel>,
    res: MedusaResponse<APIResponse<never>>
) => {
    const emailConfirmationService: EmailConfirmationService = req.scope.resolve(
        "emailConfirmationService"
     )
     res.json(await emailConfirmationService.tokenRequest(req.body.email))
}