import * as v from 'valibot';

export const User = v.object({
  id: v.optional(v.number()),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
});
