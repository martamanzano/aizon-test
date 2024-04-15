import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Lambda function to create a new solution
export async function createSolutionHandler(event: any) {
  try {
    const solutionData = JSON.parse(event.body);
    const command = new PutCommand({
      TableName: 'SolutionsTable',
      Item: {
        solutionId: solutionData.solutionId,
        name: solutionData.name,
        description: solutionData.description,
        screens: solutionData.screens || [], // Initialize with empty array if no screens provided
      },
    });
  
    const response = await docClient.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Solution created successfully' }),
    };
  } catch (error) {
    console.error('Error creating solution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Lambda function to delete a solution
export async function deleteSolutionHandler(event: any) {
  try {
    const solutionId = event.pathParameters?.id;
    
    if (!solutionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Solution ID is required' }),
      };
    }

    const command = new DeleteCommand({
      TableName: 'SolutionsTable',
      Key: {
        solutionId: solutionId,
      },
    });
  
    const response = await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Solution deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting solution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Lambda function to modify a solution
export async function modifySolutionHandler(event: any) {
  try {
    const solutionId = event.pathParameters?.id;
    const solutionData = JSON.parse(event.body);
    
    if (!solutionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Solution ID is required' }),
      };
    }

    // Update the solution in DynamoDB
    // await docClient.update({
    //   TableName: 'SolutionsTable',
    //   Key: {
    //     solutionId: solutionId,
    //   },
    //   UpdateExpression: 'SET #name = :name, #description = :description',
    //   ExpressionAttributeNames: {
    //     '#name': 'name',
    //     '#description': 'description',
    //   },
    //   ExpressionAttributeValues: {
    //     ':name': solutionData.name,
    //     ':description': solutionData.description,
    //   },
    // }).promise();
  
    const command = new UpdateCommand({
      TableName: 'SolutionsTable',
      Key: {
        solutionId: solutionId,
      },
      UpdateExpression: 'SET #name = :name, #description = :description',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#description': 'description',
      },
      ExpressionAttributeValues: {
        ':name': solutionData.name,
        ':description': solutionData.description,
      },
    });
  
    const response = await docClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Solution modified successfully' }),
    };
  } catch (error) {
    console.error('Error modifying solution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};


