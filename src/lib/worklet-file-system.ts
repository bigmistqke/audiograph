import { createFileUrlSystem, type FileUrlSystem } from "@bigmistqke/repl";
import { ReactiveMap } from "@solid-primitives/map";
import { createSignal } from "solid-js";

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
        transform: ({ source, path, fileUrls: urls }) => {
          const match = path.match(/^\/([^/]+)\/worklet\.js$/);
          if (!match) return source;

          const name = match[1];
          // Return an accessor so dependencies (source.js blob URL, version) are tracked reactively
          return () => {
            const sourceUrl = urls.get(`/${name}/source.js`);
            if (!sourceUrl) return source;

            const [ver] = getOrCreateVersion(name);
            const v = ver();

            return source
              .replaceAll("./source.js", sourceUrl)
              .replaceAll(
                /registerProcessor\s*\(\s*["'][^"']*["']/g,
                `registerProcessor("${name}_v${v}"`,
              );
          };
        },
      },
    },
  });

  return {
    files,
    fileUrls,
    writeFile(path: string, content: string) {
      const match = path.match(/^\/([^/]+)\/source\.js$/);
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

export function getSourceBoilerplate(): string {
  return `export default class extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: "gain", defaultValue: 1, minValue: 0, maxValue: 1 }];
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const gain = parameters.gain;
    for (let channel = 0; channel < output.length; ++channel) {
      if (input?.[channel]) {
        for (let i = 0; i < output[channel].length; i++) {
          output[channel][i] = input[channel][i] * (gain.length > 1 ? gain[i] : gain[0]);
        }
      }
    }
    return true;
  }
}
`;
}

export function getWorkletEntry(name: string): string {
  return `import Processor from './source.js';
try {
  registerProcessor("${name}", Processor);
} catch(error) {
  class ErrorReporter extends AudioWorkletProcessor {
    constructor() {
      super();
      this.port.postMessage({ type: 'worklet-error', message: error.message })
    }
    process() { return false; }
  }
  registerProcessor("${name}", ErrorReporter);
}`;
}
