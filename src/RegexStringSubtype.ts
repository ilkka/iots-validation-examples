import { right, left } from "fp-ts/lib/Either";
import { StringCodec } from "./Validator";

export class RegexStringSubtype<A extends string> extends StringCodec<A> {
  constructor(name: string, validate: RegExp, message?: string) {
    super(name, input =>
      input.match(validate) !== null
        ? right(input as A)
        : left(message || `Must match regex /${validate.source}/`)
    );
  }
}
