import React, { useState, useEffect } from "react";
import "./App.css";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/pipeable";
import { fold } from "fp-ts/lib/Either";

type Email = string;

function isEmailStr(s: string): boolean {
  return s.match(/^[^@]+@[^@]+$/) !== null;
}

const EmailFromString = new t.Type<Email, string, string>(
  "EmailCodec",
  (u): u is Email => isEmailStr(`${u}`),
  (input, ctx) =>
    isEmailStr(input) ? t.success(input) : t.failure(input, ctx),
  email => `${email}`
);

const Person = t.type({
  name: t.string,
  address: t.string,
  email: t.string.pipe(EmailFromString),
  phone: t.string
});

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const errors = pipe(
    Person.decode({ name, address, email, phone }),
    fold(
      () => <p>Failboat</p>,
      () => null
    )
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Some forms</h1>
      </header>
      <main>
        <form>
          {errors}
          <label>
            Name:{" "}
            <input
              type="text"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            Address:{" "}
            <input
              type="text"
              name="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </label>
          <label>
            Email:{" "}
            <input
              type="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label>
            Phone:{" "}
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </label>
        </form>
      </main>
    </div>
  );
};

export default App;
