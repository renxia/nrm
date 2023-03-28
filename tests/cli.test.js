// const open = require("open");
const { spawnSync: spawn } = require("node:child_process");
const { color } = require("console-log-colors");
const { Request } = require("@lzwme/fe-utils");
const { onHome, onTest } = require("../src/actions.js");
const isWin = process.platform === "win32";
const isCI = Boolean(process.env.CI || process.env.GITHUB_CI);
const pkgName = "@lzwme/nrm";

jest.spyOn(Request.prototype, "get").mockImplementation((url) => {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          response: { statusCode: url.includes("error.com") ? -1 : 200 },
        }),
      (Math.random() + 1) * 1000
    );
  });
});

process.setMaxListeners(10000);
jest.setTimeout(20000);
// jest.unstable_mockModule("open", () => ({
//   default: jest.fn(() => console.log("browser opened"))
// }));

let __NRM_VERSION__ = null;

beforeAll(async () => {
  if (!isCI) {
    const { stdout } = spawn("nrm", ["-V"], { shell: isWin, encoding: "utf8" });
    __NRM_VERSION__ = stdout || null;
  }

  spawn("npm", ["link"], { shell: isWin, encoding: "utf8" });
});

afterAll(async () => {
  await spawn("npm", [`unlink ${pkgName} -g`], {
    shell: isWin,
    encoding: "utf8",
  });
  if (__NRM_VERSION__ !== null) {
    await spawn("npm", [`install -g ${pkgName}@${__NRM_VERSION__}`], {
      shell: isWin,
      encoding: "utf8",
    });
  }
});

it("nrm ls", async () => {
  let r = await spawn("nrm", ["use cnpm"], { shell: isWin, encoding: "utf8" });
  expect(/The registry has been changed to 'cnpm'/g.test(r.stdout)).toBe(true);
  expect(r.status).toBe(0);

  const { stdout } = await spawn("nrm", ["ls"], {
    shell: isWin,
    encoding: "utf8",
  });
  const match = color.green.bold("* ") + "cnpm";
  expect(stdout.includes(match)).toBe(true);
});

it("nrm use <registry>", async () => {
  const r = spawn("nrm", ["use cnpm"], { shell: isWin, encoding: "utf8" });
  expect(/The registry has been changed to 'cnpm'/g.test(r.stdout)).toBe(true);
  expect(r.status).toBe(0);
});

it("nrm current", async () => {
  let r = spawn("nrm", ["use cnpm"], { shell: isWin, encoding: "utf8" });
  expect(/The registry has been changed to 'cnpm'/g.test(r.stdout)).toBe(true);

  r = spawn("nrm", ["current"], { shell: isWin, encoding: "utf8" });
  expect(/cnpm/g.test(r.stdout)).toBe(true);
});

describe("nrm command which needs to add a custom registry", () => {
  const customName = "customName";
  const url = "https://registry.error.com/";

  beforeEach(async () => {
    /* the globalVariable in jest.config.js */
    __REGISTRY__ = customName;

    const r = spawn("nrm", [`add ${__REGISTRY__} ${url}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(r.stdout.includes("success")).toBe(true);
  });

  afterEach(async () => {
    const r = spawn("nrm", [`del ${__REGISTRY__}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(/has been deleted successfully/g.test(r.stdout)).toBe(true);
  });

  it("nrm rename", async () => {
    const newName = "newName";
    __REGISTRY__ = newName;
    const match = new RegExp(
      `The registry '${customName}' has been renamed to '${newName}'`,
      "g"
    );

    const r = spawn("nrm", [`rename ${customName} ${newName}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(match.test(r.stdout)).toBe(true);
  });

  it("nrm set <name>", async () => {
    const attr = "attr";
    const value = "value";

    const r = spawn("nrm", [`set ${__REGISTRY__} -a ${attr} -v ${value}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(/successfully/g.test(r.stdout)).toBe(true);
  });

  it("nrm test [registry]", async () => {
    const results = await onTest();
    expect(results.every((ele) => /\d+\sms/.test(ele))).toBe(true);
    expect(results.some((ele) => ele.includes("*"))).toBe(true);
    expect(results.some((ele) => ele.includes("please ignore"))).toBe(true);
  });

  it("nrm set-scope <scopeName> <url>, del-scope <scopeName>", async () => {
    const scopeName = "nrm";
    const url = "https://scope.example.org";

    let r = spawn("nrm", [`set-scope ${scopeName} ${url}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(/success/g.test(r.stdout)).toBe(true);

    r = spawn("nrm", [`del-scope ${scopeName}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(/success/g.test(r.stdout)).toBe(true);
  });

  it("nrm set-hosted-repo <name> <repo>", async () => {
    const repo = "repo";
    const match = new RegExp(
      `Set the repository of registry '${__REGISTRY__}' successfully`,
      "g"
    );

    const r = spawn("nrm", [`set-hosted-repo ${__REGISTRY__} ${repo}`], {
      shell: isWin,
      encoding: "utf8",
    });
    expect(match.test(r.stdout)).toBe(true);
  });

  it("login <name> [base64]", async () => {
    const username = "username";
    const password = "password";

    let r = spawn(
      "nrm",
      [`login ${__REGISTRY__} -u ${username} -p ${password}`],
      {
        shell: isWin,
        encoding: "utf8",
      }
    );
    expect(/success/g.test(r.stdout)).toBe(true);

    r = spawn("nrm", [`login ${__REGISTRY__}`], {
      shell: isWin,
      encoding: "utf8",
    });

    console.log("---stderr: ", r.stderr);
    expect(
      /Authorization information in base64 format or username & password is required/g.test(
        r.stderr
      )
    ).toBe(true);
  });
});

// it("nrm home <registry> [browser]", async () => {
//   await onHome("cnpm");
//   expect(open).toHaveBeenCalled();
// });
