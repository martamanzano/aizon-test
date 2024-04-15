import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

// Lambda function to create a new screen
export const createScreenHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const screenData = JSON.parse(event.body);

    // Store screen data in DynamoDB
    await dynamoDB.put({
      TableName: 'ScreensTable',
      Item: {
        screenId: screenData.screenId,
        name: screenData.name,
        layout: screenData.layout,
        widgets: screenData.widgets || [], // Initialize with empty array if no widgets provided
      },
    }).promise();

    // Update the associated solution with the new screen
    await dynamoDB.update({
      TableName: 'SolutionsTable',
      Key: { solutionId: screenData.solutionId },
      UpdateExpression: 'SET #screens = list_append(if_not_exists(#screens, :emptyList), :screenId)',
      ExpressionAttributeNames: { '#screens': 'screens' },
      ExpressionAttributeValues: { ':screenId': [screenData.screenId], ':emptyList': [] },
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Screen created successfully' }),
    };
  } catch (error) {
    console.error('Error creating screen:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Lambda function to delete a screen
export const deleteScreenHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const screenId = event.pathParameters?.id;
    
    if (!screenId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Screen ID is required' }),
      };
    }

    // Get the solution ID associated with the screen
    const solutionResponse = await dynamoDB.scan({
      TableName: 'SolutionsTable',
      FilterExpression: 'contains(screens, :screenId)',
      ExpressionAttributeValues: {
        ':screenId': screenId,
      },
    }).promise();

    if (!solutionResponse.Items || solutionResponse.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Associated solution not found' }),
      };
    }

    const solutionId = solutionResponse.Items[0].solutionId;

    // Delete the screen from DynamoDB
    await dynamoDB.delete({
      TableName: 'ScreensTable',
      Key: {
        screenId: screenId,
      },
    }).promise();

    // Remove the screen ID from the associated solution
    await dynamoDB.update({
      TableName: 'SolutionsTable',
      Key: { solutionId: solutionId },
      UpdateExpression: 'REMOVE #screens[#index]',
      ExpressionAttributeNames: { '#screens': 'screens' },
      ExpressionAttributeValues: { '#index': solutionResponse.Items[0].screens.indexOf(screenId) },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Screen deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting screen:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Lambda function to modify a screen
export const modifyScreenHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const screenId = event.pathParameters?.id;
    const screenData = JSON.parse(event.body);
    
    if (!screenId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Screen ID is required' }),
      };
    }

    // Update the screen in DynamoDB
    await dynamoDB.update({
      TableName: 'ScreensTable',
      Key: {
        screenId: screenId,
      },
      UpdateExpression: 'SET #name = :name, #layout = :layout, #widgets = :widgets',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#layout': 'layout',
        '#widgets': 'widgets',
      },
      ExpressionAttributeValues: {
        ':name': screenData.name,
        ':layout': screenData.layout,
        ':widgets': screenData.widgets || [], // Initialize with empty array if no widgets provided
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Screen modified successfully' }),
    };
  } catch (error) {
    console.error('Error modifying screen:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
