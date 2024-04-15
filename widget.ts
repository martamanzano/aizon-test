import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

// Lambda function to create a new widget
export const createWidgetHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const widgetData = JSON.parse(event.body);

    // Store widget data in DynamoDB
    await dynamoDB.put({
      TableName: 'WidgetsTable',
      Item: {
        widgetId: widgetData.widgetId,
        type: widgetData.type,
        configuration: widgetData.configuration,
      },
    }).promise();

    // Update the associated screen with the new widget
    await dynamoDB.update({
      TableName: 'ScreensTable',
      Key: { screenId: widgetData.screenId },
      UpdateExpression: 'SET #widgets = list_append(if_not_exists(#widgets, :emptyList), :widgetId)',
      ExpressionAttributeNames: { '#widgets': 'widgets' },
      ExpressionAttributeValues: { ':widgetId': [widgetData.widgetId], ':emptyList': [] },
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Widget created successfully' }),
    };
  } catch (error) {
    console.error('Error creating widget:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Lambda function to delete a widget
export const deleteWidgetHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const widgetId = event.pathParameters?.id;
    
    if (!widgetId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Widget ID is required' }),
      };
    }

    // Get the screen ID associated with the widget
    const screenResponse = await dynamoDB.scan({
      TableName: 'ScreensTable',
      FilterExpression: 'contains(widgets, :widgetId)',
      ExpressionAttributeValues: {
        ':widgetId': widgetId,
      },
    }).promise();

    if (!screenResponse.Items || screenResponse.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Associated screen not found' }),
      };
    }

    const screenId = screenResponse.Items[0].screenId;

    // Delete the widget from DynamoDB
    await dynamoDB.delete({
      TableName: 'WidgetsTable',
      Key: {
        widgetId: widgetId,
      },
    }).promise();

    // Remove the widget ID from the associated screen
    await dynamoDB.update({
      TableName: 'ScreensTable',
      Key: { screenId: screenId },
      UpdateExpression: 'REMOVE #widgets[#index]',
      ExpressionAttributeNames: { '#widgets': 'widgets' },
      ExpressionAttributeValues: { '#index': screenResponse.Items[0].widgets.indexOf(widgetId) },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Widget deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting widget:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Lambda function to modify a widget
export const modifyWidgetHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const widgetId = event.pathParameters?.id;
    const widgetData = JSON.parse(event.body);
    
    if (!widgetId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Widget ID is required' }),
      };
    }

    // Update the widget in DynamoDB
    await dynamoDB.update({
      TableName: 'WidgetsTable',
      Key: {
        widgetId: widgetId,
      },
      UpdateExpression: 'SET #type = :type, #configuration = :configuration',
      ExpressionAttributeNames: {
        '#type': 'type',
        '#configuration': 'configuration',
      },
      ExpressionAttributeValues: {
        ':type': widgetData.type,
        ':configuration': widgetData.configuration,
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Widget modified successfully' }),
    };
  } catch (error) {
    console.error('Error modifying widget:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
