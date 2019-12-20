import { getMonoid as getArrayMonoid } from "fp-ts/lib/Array";
import {fold, right, left } from "fp-ts/lib/Either";
import {
  getMonoid as getOptionMonoid,
  none,
  Option,
  some,
  toNullable,
  map as mapOption
} from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as t from "io-ts";
import React, { useState } from "react";
import "./App.css";
import { StringCodec, Validator } from "./Validator";
import { RegexStringSubtype } from "./RegexStringSubtype";
import { EmailCodec } from "./Email";
import {flow} from "fp-ts/lib/function";
import {inspect} from "util";

type NonEmptyString = string;

const validateNonEmpty: Validator<string, NonEmptyString> = (input: string) =>
  input.match(/\S+/) !== null ? right(input) : left("Must be non-empty");

const NonEmptyString = new StringCodec<NonEmptyString>(
  "NonEmptyString",
  validateNonEmpty
);

type AddressString = NonEmptyString;

const isAddressString: Validator<string, AddressString> = (
  input: NonEmptyString
) =>
  input.length <= 100 ? right(input) : left("Must be under 100 characters");

const AddressStringFromNonEmptyString = new StringCodec<AddressString>(
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
  // Composability!
  name: t.string.pipe(NonEmptyString),
  address: t.string.pipe(NonEmptyString).pipe(AddressStringFromNonEmptyString),
  email: t.string.pipe(NonEmptyString).pipe(EmailCodec),
  phone: t.string.pipe(NonEmptyString).pipe(PhoneNumberStringFromNonEmptyString)
});


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

function showErrors(errors: Option<string[]>) {
  return toNullable(mapOption((e: string[]) => <span className="errors">{e.join(", ")}</span>)(errors));
}

const errorsForName = flow(errorsForField("name"), showErrors);
const errorsForAddress = flow(errorsForField("address"), showErrors);
const errorsForEmail = flow(errorsForField("email"), showErrors);
const errorsForPhone = flow(errorsForField("phone"), showErrors);

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
            <span className="labelText">Name:</span>{" "}
            <input
              type="text"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            {errorsForName(errors)}
          </label>
          <label>
            <span className="labelText">Address:</span>{" "}
            <input
              type="text"
              name="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            {errorsForAddress(errors)}
          </label>
          <label>
            <span className="labelText">Email:</span>{" "}
            <input
              type="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {errorsForEmail(errors)}
          </label>
          <label>
            <span className="labelText">Phone:</span>{" "}
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            {errorsForPhone(errors)}
          </label>
          <pre><code>{inspect(result)}</code></pre>
        </form>
      </main>
    </div>
  );
};

export default App;
