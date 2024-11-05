import type { Request, Response } from "express";
import SalesforceHandler from "../handlers/SalesForceHandler";
import { accountSchema, contactSchema } from "../types/Salesforce";
import { AppError } from "../utils/AppError";
import type UserHandler from "../handlers/UserHandler";

export default class SalesforceController {
  private salesforceHandler: SalesforceHandler;
  private userHandler: UserHandler;

  constructor(salesforceHandler: SalesforceHandler, userHandler: UserHandler) {
    this.salesforceHandler = salesforceHandler;
    this.userHandler = userHandler;
  }

  // Validate user authorization
  private validateUser(req: Request) {
    const { id: userId, role, status } = (req as any).user;
    if (
      !userId ||
      (role !== "admin" && role !== "regular") ||
      status !== "active"
    ) {
      throw new AppError(
        401,
        "The user is not authorized to create an account"
      );
    }
    return { userId, role, status };
  }

  async baseRoute(req: Request, res: Response) {
    res.json({ message: "Hello, Salesforce!" });
  }

  async getSalesforceAccount(req: Request, res: Response) {
    try {
      const { userId } = this.validateUser(req);

      const account = await this.userHandler.getSalesforceAccount(userId);

      res.json(account);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  async createSalesforceAccount(req: Request, res: Response) {
    try {
      const { ContactInfo, ...accountData } = req.body;

      const { userId } = this.validateUser(req);

      // Check if the user has a Salesforce account already
      const userSalesforceAccount = await this.userHandler.getSalesforceAccount(
        userId
      );

      if (userSalesforceAccount) {
        throw new AppError(400, "User already has a Salesforce account");
      }

      // Duplication check rule.
      const options = {
        headers: {
          "Sforce-Duplicate-Rule-Header": "allowSave=true",
        },
      };
      // Extract contact info from request body

      // Create the Salesforce account first
      const account = accountSchema.parse(accountData);
      const createdAccount = await this.salesforceHandler.createAccount(
        account,
        options
      );

      // Create the Salesforce contact with the account association
      const contact = contactSchema.parse({
        ...ContactInfo,
        AccountId: createdAccount.id, // Link the contact to the created account
      });

      const createdContact = await this.salesforceHandler.createContact(
        contact,
        options
      );

      // Add the new Salesforce account information to the database and connect it to the user
      const newAccount = await this.salesforceHandler.addNewSalesforceAccount(
        userId,
        account,
        createdAccount.id,
        contact,
        createdContact.id
      );

      res.json(newAccount);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async updateSalesforceAccount(req: Request, res: Response) {
    try {
      const { userId } = this.validateUser(req);
      const { accountId: id } = req.params;

      const account = await this.userHandler.getSalesforceAccount(userId);

      if (!account) {
        throw new AppError(400, "User does not have a Salesforce account");
      }

      const { ContactInfo, ...accountData } = req.body;

      // Update the Salesforce account
      const updateResponse = await this.salesforceHandler.updateAccount(
        account.accountId,
        accountData
      );

      // Update the Salesforce contact
      const updatedContact = await this.salesforceHandler.updateContact(
        account.contactId as string,
        ContactInfo
      );

      // Update the database with the new account information
      const updatedAccount =
        await this.salesforceHandler.updateSalesforceAccount(userId, {
          ...accountData,
          ...ContactInfo,
        });

      res.json(updatedAccount);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
