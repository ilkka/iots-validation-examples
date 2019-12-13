import { getMonoid as getArrayMonoid } from "fp-ts/lib/Array";
import { fold, Either, isRight, right, left } from "fp-ts/lib/Either";
import {
  getMonoid as getOptionMonoid,
  none,
  Option,
  some,
  toNullable
} from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as t from "io-ts";
import React, { useState } from "react";
import "./App.css";

type Validator<I, A> = (input: I) => Either<string, A>;

class StringSubtype<A extends string> extends t.Type<A, string, string> {
  constructor(
    /** a unique name for this codec */
    name: string,
    /** returns either the string decoded to A or an error message */
    validate: Validator<string, A>
  ) {
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

class RegexStringSubtype<A extends string> extends StringSubtype<A> {
  constructor(name: string, validate: RegExp, message?: string) {
    super(name, input =>
      input.match(validate) !== null
        ? right(input as A)
        : left(message || `Must match regex /${validate.source}/`)
    );
  }
}

type Email = string;

const EmailFromString = new RegexStringSubtype<Email>(
  "EmailFromString",
  /^[^@]+@[^@]+$/,
  "Must be a valid e-mail address"
);

type NonEmptyString = string;

const validateNonEmpty: Validator<string, NonEmptyString> = (input: string) =>
  input.match(/\S+/) !== null ? right(input) : left("Must be non-empty");

const NonEmptyString = new StringSubtype<NonEmptyString>(
  "NonEmptyString",
  validateNonEmpty
);

type AddressString = NonEmptyString;

const isAddressString: Validator<string, AddressString> = (
  input: NonEmptyString
) =>
  input.length <= 100 ? right(input) : left("Must be under 100 characters");

const AddressStringFromNonEmptyString = new StringSubtype<AddressString>(
  "AddressStringFromNonEmptyString",
  isAddressString
);

type PhoneNumberString = NonEmptyString;

const HasCountryCodeCodec = new RegexStringSubtype<PhoneNumberString>(
  "HasCountryCodeCodec",
  /^([+]|00)[0-9]{2,4}/,
  "Must start with a country code"
);

const HasAreaCodeCodec = new RegexStringSubtype<PhoneNumberString>(
  "HasAreaCodeCodec",
  /^[0-9+]{3,6}(\s|-)?[0-9]{1,4}/,
  "Must have an area code"
);

const HasLocalPartCodec = new RegexStringSubtype<PhoneNumberString>(
  "HasLocalPartCodec",
  /^[0-9+-]{4,11}(\s|-)?[0-9]{4,}$/,
  "Must be a complete phone number"
);

const PhoneNumberStringFromNonEmptyString = HasCountryCodeCodec.pipe(
  HasAreaCodeCodec
).pipe(HasLocalPartCodec);

const Person = t.type({
  name: t.string.pipe(NonEmptyString),
  address: t.string.pipe(NonEmptyString).pipe(AddressStringFromNonEmptyString),
  email: t.string.pipe(EmailFromString),
  phone: t.string.pipe(NonEmptyString).pipe(PhoneNumberStringFromNonEmptyString)
});

type Person = t.TypeOf<typeof Person>;

const errorCombinator = getOptionMonoid(getArrayMonoid<string>());

function errorsForField(field: string): (e: t.Errors) => Option<string[]> {
  return errors =>
    errors
      .filter(error => error.context.slice(-1).find(val => val.key === field))
      .map(error => error.message || `Unknown error`)
      .reduce(
        (acc: Option<string[]>, cur) =>
          errorCombinator.concat(acc, some([cur])),
        none
      );
}

const errorsForName = errorsForField("name");
const errorsForAddress = errorsForField("address");
const errorsForEmail = errorsForField("email");
const errorsForPhone = errorsForField("phone");

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const result = Person.decode({ name, address, email, phone });
  const errors = pipe(
    result,
    fold(
      errors => errors,
      _person => []
    )
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Some forms</h1>
      </header>
      <main>
        <form>
          <label>
            Name:{" "}
            <input
              type="text"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            {toNullable(errorsForName(errors))}
          </label>
          <label>
            Address:{" "}
            <input
              type="text"
              name="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            {toNullable(errorsForAddress(errors))}
          </label>
          <label>
            Email:{" "}
            <input
              type="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {toNullable(errorsForEmail(errors))}
          </label>
          <label>
            Phone:{" "}
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            {toNullable(errorsForPhone(errors))}
          </label>
        </form>
      </main>
    </div>
  );
};

export default App;
