import { StringifiedType } from "./Validator";
import { left, right } from "fp-ts/lib/Either";

export type Email = {
  localPart: string;
  domain: string;
};

export const EmailCodec = new StringifiedType<Email>("EmailCodec", input => {
  console.log(input);
  const parts = input.match(/^(\S+)@(\S+)$/);
  console.dir(parts);
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
