import { NextApiResponse } from 'next';
import { users } from "@/db/schema/auth";

export type User = typeof users.$inferSelect;

export interface GraphQLContext {
  user?: User | null;
  req: Request;
  res: NextApiResponse;
}

export interface GraphQLResolver<Args = unknown, Return = unknown> {
  (_: unknown, args: Args, context: GraphQLContext): Promise<Return>;
}
