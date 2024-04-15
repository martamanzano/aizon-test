import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

// Lambda function to create a new solution
// export const createSolutionHandler: APIGatewayProxyHandler = async (event) => {
export async function createSolutionHandler(event) {
  try {
    const solutionData = JSON.parse(event.body);

    // Store solution data in DynamoDB
    await dynamoDB.put({
      TableName: 'SolutionsTable',
      Item: {
        solutionId: solutionData.solutionId,
        name: solutionData.name,
        description: solutionData.description,
        screens: solutionData.screens || [], // Initialize with empty array if no screens provided
      },
    }).promise();

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
export async function deleteSolutionHandler(event) {
  try {
    const solutionId = event.pathParameters?.id;
    
    if (!solutionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Solution ID is required' }),
      };
    }

    // Delete the solution from DynamoDB
    await dynamoDB.delete({
      TableName: 'SolutionsTable',
      Key: {
        solutionId: solutionId,
      },
    }).promise();

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
export async function modifySolutionHandler(event) {
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
    await dynamoDB.update({
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
    }).promise();

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


