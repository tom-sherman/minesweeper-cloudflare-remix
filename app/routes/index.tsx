import { Form } from "@remix-run/react";
import { IntegerInput } from "~/components/IntegerInput";
import { PRESETS } from "~/game/presets";

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/blog"
            rel="noreferrer"
          >
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/jokes"
            rel="noreferrer"
          >
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/docs" rel="noreferrer">
            Remix Docs
          </a>
        </li>
      </ul>
      <LocalGameSetupForm />
    </div>
  );
}

const LocalGameSetupForm = () => {
  return (
    <Form method="get" action="/local-game">
      <table cellPadding="2">
        <tbody>
          <tr>
            <td></td>
            <td>Height</td>
            <td>Width</td>
            <td>Mines</td>
          </tr>
          {Object.entries(PRESETS).map(([preset, { width, height, mines }]) => (
            <tr key={preset}>
              <td>
                <label>
                  <input
                    type="radio"
                    name="preset"
                    value={preset}
                    defaultChecked
                  />{" "}
                  <strong>{preset}</strong>
                </label>
              </td>
              <td>{height}</td>
              <td>{width}</td>
              <td>{mines}</td>
            </tr>
          ))}
          <tr>
            <td>
              <label>
                <input type="radio" name="preset" value="custom" /> Custom
              </label>
            </td>
            <td>
              <IntegerInput
                name="customHeight"
                min={1}
                max={100}
                defaultValue={20}
              />
            </td>
            <td>
              <IntegerInput
                name="customWidth"
                min={1}
                max={100}
                defaultValue={30}
              />
            </td>
            <td>
              <IntegerInput
                name="customMines"
                min={1}
                max={1000}
                defaultValue={145}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <button type="submit">New local game</button>
    </Form>
  );
};
