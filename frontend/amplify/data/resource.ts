import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Define your data schema
 * @see https://docs.amplify.aws/react/build-a-backend/data/set-up-data/
 */
const schema = a.schema({
}).authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyConfig: {
      expiresInDays: 30,
    },
  },
});
