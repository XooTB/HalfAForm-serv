import { PrismaClient, type SalesforceAccount } from "@prisma/client";
import jsforce, { Connection } from "jsforce";

import { AppError } from "../utils/AppError";
import type { Account, Contact } from "../types/Salesforce";

export default class SalesforceHandler {
  private prisma: PrismaClient;
  private conn: Connection;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.conn = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_LOGIN_URL,
      version: "62.0",
    });
  }

  async initializeConnection() {
    const { SALESFORCE_USERNAME, SALESFORCE_PASSWORD, SALESFORCE_TOKEN } =
      process.env;

    try {
      await this.conn.login(
        SALESFORCE_USERNAME as string,
        (SALESFORCE_PASSWORD as string) + (SALESFORCE_TOKEN as string)
      );
    } catch (error) {
      throw new AppError(500, "Failed to initialize Salesforce connection");
    }
  }

  async getAllAccounts() {
    try {
      const accounts = await this.conn.sobject("Account").find().execute();

      return accounts;
    } catch (error) {
      throw new AppError(500, "Failed to fetch Salesforce accounts");
    }
  }

  async getOrgInfo() {
    const orgInfo = await this.conn.identity();
    return orgInfo;
  }

  async createAccount(account: any, options?: any): Promise<any> {
    const newAccount = await this.conn
      .sobject("Account")
      .create(account, options);

    if (!newAccount) {
      throw new AppError(500, "Failed to create Salesforce account");
    }

    return newAccount;
  }

  async createContact(contact: any, options?: any): Promise<any> {
    const newContact = await this.conn
      .sobject("Contact")
      .create(contact, options);

    if (!newContact) {
      throw new AppError(500, "Failed to create Salesforce contact");
    }

    return newContact;
  }

  // Add the new Salesforce account information to the database and connect it to the user
  async addNewSalesforceAccount(
    userId: string,
    account: Account,
    accountId: string,
    contact: Contact,
    contactId: string
  ): Promise<any> {
    const newAccount = await this.prisma.salesforceAccount.create({
      data: {
        userId: userId,
        accountId: accountId,
        contactId: contactId,
        name: account.Name,
        description: account.Description,
        site: account.Site,
        phone: account.Phone,
        website: account.Website,
        type: account.Type,
        FirstName: contact.FirstName,
        LastName: contact.LastName,
        Email: contact.Email,
        MobilePhone: contact.MobilePhone,
      },
    });

    if (!newAccount) {
      throw new AppError(500, "Failed to create Salesforce account");
    }

    return newAccount;
  }

  async updateAccount(accountId: string, data: any): Promise<any> {
    const updatedAccount = await this.conn
      .sobject("Account")
      .update([{ Id: accountId, ...data }]);

    return updatedAccount;
  }

  async updateContact(contactId: string, data: any): Promise<any> {
    const updatedContact = await this.conn
      .sobject("Contact")
      .update([{ Id: contactId, ...data }]);

    return updatedContact;
  }

  async updateSalesforceAccount(
    userId: string,
    data: Partial<Account & Contact>
  ): Promise<any> {
    const updatedAccount = this.prisma.salesforceAccount.update({
      where: { userId },
      data: {
        name: data.Name,
        description: data.Description,
        site: data.Site,
        phone: data.Phone,
        // @ts-ignore
        website: data.website,
        type: data.Type,
        FirstName: data.FirstName,
        LastName: data.LastName,
        Email: data.Email,
        MobilePhone: data.MobilePhone,
      },
    });

    if (!updatedAccount) {
      throw new AppError(500, "Failed to update Salesforce account");
    }

    return updatedAccount;
  }
}
