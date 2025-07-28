import * as v from 'valibot';

export const User = v.object({
  id: v.number(),
  name: v.string(),
  email: v.string(),
  status: Status,
});

export const Status = v.union([v.literal('active'), v.literal('inactive')]);
