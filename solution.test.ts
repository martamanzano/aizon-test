// import { createSolutionHandler, deleteSolutionHandler, modifySolutionHandler } from './solution';
const { createSolutionHandler, deleteSolutionHandler, modifySolutionHandler } = require('./solution');
const { DynamoDB } = require('aws-sdk');
import { APIGatewayEvent } from "aws-lambda";
 
jest.mock('aws-sdk', () => {
  const DocumentClient = {
    put: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return { DynamoDB: { DocumentClient } };
});

describe('Lambda Functions', () => {
  let event: APIGatewayEvent;
  let context: any;

  // beforeEach(() => {
  //   event = APIGatewayEvent();
  //   context = {};
  // });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSolutionHandler', () => {
    test('should create a solution', async () => {
      event.body = JSON.stringify({
        solutionId: '1',
        name: 'Test Solution',
        description: 'This is a test solution',
        screens: ['Screen 1', 'Screen 2'],
      });

      const expectedParams = {
        TableName: 'SolutionsTable',
        Item: {
          solutionId: '1',
          name: 'Test Solution',
          description: 'This is a test solution',
          screens: ['Screen 1', 'Screen 2'],
        },
      };

      await createSolutionHandler(event, context);

      expect(DynamoDB.DocumentClient.put).toHaveBeenCalledWith(expectedParams);
      expect(DynamoDB.DocumentClient.promise).toHaveBeenCalled();
    });

    // Add more test cases for error handling if needed
  });

  describe('deleteSolutionHandler', () => {
    test('should delete a solution', async () => {
      event.pathParameters = { id: '1' };

      await deleteSolutionHandler(event, context);

      expect(DynamoDB.DocumentClient.delete).toHaveBeenCalledWith({
        TableName: 'SolutionsTable',
        Key: { solutionId: '1' },
      });
      expect(DynamoDB.DocumentClient.promise).toHaveBeenCalled();
    });

    // Add more test cases for error handling if needed
  });

  describe('modifySolutionHandler', () => {
    test('should modify a solution', async () => {
      event.pathParameters = { id: '1' };
      event.body = JSON.stringify({ name: 'Modified Name', description: 'Modified Description' });

      const expectedParams = {
        TableName: 'SolutionsTable',
        Key: { solutionId: '1' },
        UpdateExpression: 'SET #name = :name, #description = :description',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#description': 'description',
        },
        ExpressionAttributeValues: {
          ':name': 'Modified Name',
          ':description': 'Modified Description',
        },
      };

      await modifySolutionHandler(event, context);

      expect(DynamoDB.DocumentClient.update).toHaveBeenCalledWith(expectedParams);
      expect(DynamoDB.DocumentClient.promise).toHaveBeenCalled();
    });

    // Add more test cases for error handling if needed
  });
});
