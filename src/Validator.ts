import { fold, Either, isRight } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import * as t from "io-ts";

export type Validator<I, A> = (input: I) => Either<string, A>;

export class StringCodec<A> extends t.Type<A, string, string> {
  constructor(name: string, validate: Validator<string, A>) {
    super(
      name,
      (u): u is A => isRight(validate(`${u}`)),
      (input, ctx) =>
        pipe(
          validate(input),
          fold(
            e => t.failure(input, ctx, e),
            a => t.success(a)
          )
        ),
      a => `${a}`
    );
  }
}
