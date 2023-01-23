import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient";
import * as dayjs from "dayjs"; 
import { join } from "path";
import { compile } from "handlebars"
import { readFileSync } from "fs";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  grade: string;
  medal: string;
  date: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const  { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;
  
  await document.put({
    TableName: "users_certificate",
    Item: {
      id,
      name,
      grade,
      created_at: new Date().getTime()
    }
  }).promise();

  const compileTemplate = async (data: ITemplate) => {
    const filePath = join(process.cwd(), "src", "templates", "certificates.hbs")

    const html = readFileSync(filePath, "utf-8");

    return compile(html)(data)
  }

  const medalPath = join(process.cwd(), "src", "templates", "selo.png");
  const medal = readFileSync(medalPath, "base64");

  const data: ITemplate = {
    name,
    id, 
    grade,
    date: dayjs().format("DD/MM/YYYY"),
    medal 
  }

  const content = await compileTemplate(data)

  const response = await document.query({
    TableName: "users_certificate",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id,
    }
  }).promise()


  return {
    statusCode: 201,
    body: JSON.stringify(response.Items[0])
  }
}