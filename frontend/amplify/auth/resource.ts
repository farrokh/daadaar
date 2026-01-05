import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/react/build-a-backend/auth/concepts/
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
