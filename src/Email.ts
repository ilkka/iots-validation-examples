import { StringCodec } from "./Validator";
import { left, right } from "fp-ts/lib/Either";

export type Email = {
  localPart: string;
  domain: string;
};

export const EmailCodec = new StringCodec<Email>("EmailCodec", input => {
  const parts = input.match(/^(\S+)@(\S+)$/);

  if (parts === null)
    return left("A valid email address is two parts separated by @");

  const [_, localPart, domain] = parts;
  if (`${localPart}${domain}`.includes("@"))
    return left("A valid email address has only one @");
  if (domain.includes(".."))
    return left("A valid email address has a valid domain");

  return right({
    localPart,
    domain
  });
});
