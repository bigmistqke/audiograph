import { ReactiveMap } from "@solid-primitives/map";
import { createSignal } from "solid-js";
import { createFileUrlSystem, type FileUrlSystem } from "@bigmistqke/repl";

export interface WorkletFileSystem {
  files: ReactiveMap<string, string>;
  fileUrls: FileUrlSystem;
  writeFile(path: string, content: string): void;
  readFile(path: string): string | undefined;
  getVersion(name: string): number;
  getProcessorName(name: string): string;
}

export function createWorkletFileSystem(): WorkletFileSystem {
  const files = new ReactiveMap<string, string>();
  const versionSignals = new Map<
    string,
    [get: () => number, set: (fn: (v: number) => number) => void]
  >();

  function getOrCreateVersion(name: string) {
    if (!versionSignals.has(name)) {
      const [get, set] = createSignal(0);
      versionSignals.set(name, [get, set]);
    }
    return versionSignals.get(name)!;
  }

  const fileUrls = createFileUrlSystem({
    readFile: (path: string) => files.get(path),
    extensions: {
      js: {
        type: "javascript",
        transform: ({ source, path }) => {
          const match = path.match(/^\/([^/]+)\/worklet\.js$/);
          if (!match) return source;
          const name = match[1];
          const [ver] = getOrCreateVersion(name);
          const v = ver();
          return source.replace(
            /registerProcessor\s*\(\s*["'][^"']*["']/,
            `registerProcessor("${name}_v${v}"`,
          );
        },
      },
    },
  });

  return {
    files,
    fileUrls,
    writeFile(path: string, content: string) {
      const match = path.match(/^\/([^/]+)\/worklet\.js$/);
      if (match) {
        const name = match[1];
        const [, setVer] = getOrCreateVersion(name);
        setVer((v) => v + 1);
      }
      files.set(path, content);
    },
    readFile(path: string) {
      return files.get(path);
    },
    getVersion(name: string) {
      const [ver] = getOrCreateVersion(name);
      return ver();
    },
    getProcessorName(name: string) {
      const [ver] = getOrCreateVersion(name);
      return `${name}_v${ver()}`;
    },
  };
}

function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join("");
}

export function getWorkletProcessorBoilerplate(name: string): string {
  const className = pascalCase(name) + "Processor";
  return `class ${className} extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }
    return true;
  }
}

registerProcessor("${name}", ${className});
`;
}
