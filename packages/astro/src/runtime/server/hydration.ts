import type { AstroComponentMetadata } from '../../@types/astro';
import type { SSRElement } from '../../@types/astro';
import { serializeListValue } from './util.js';
import serialize from 'serialize-javascript';

// Serializes props passed into a component so that they can be reused during hydration.
export function serializeProps(value: any) {
  return serialize(value);
}

const HydrationDirectives = ['load', 'idle', 'media', 'visible', 'only'];

interface ExtractedProps {
  hydration: {
    directive: string;
    value: string;
    componentUrl: string;
    componentExport: { value: string };
  } | null;
  props: Record<string | number, any>;
}

// Used to extract the directives, aka `client:load` information about a component.
// Finds these special props and removes them from what gets passed into the component.
export function extractDirectives(inputProps: Record<string | number, any>): ExtractedProps {
  let extracted: ExtractedProps = {
    hydration: null,
    props: {},
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith('client:')) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: '',
          value: '',
          componentUrl: '',
          componentExport: { value: '' },
        };
      }
      switch (key) {
        case 'client:component-path': {
          extracted.hydration.componentUrl = value;
          break;
        }
        case 'client:component-export': {
          extracted.hydration.componentExport.value = value;
          break;
        }
        default: {
          extracted.hydration.directive = key.split(':')[1];
          extracted.hydration.value = value;

          // throw an error if an invalid hydration directive was provided
          if (HydrationDirectives.indexOf(extracted.hydration.directive) < 0) {
            throw new Error(`Error: invalid hydration directive "${key}". Supported hydration methods: ${HydrationDirectives.map((d) => `"client:${d}"`).join(', ')}`);
          }

          // throw an error if the query wasn't provided for client:media
          if (extracted.hydration.directive === 'media' && typeof extracted.hydration.value !== 'string') {
            throw new Error('Error: Media query must be provided for "client:media", similar to client:media="(max-width: 600px)"');
          }

          break;
        }
      }
    } else if (key === 'class:list') {
      // support "class" from an expression passed into a component (#782)
      extracted.props[key.slice(0, -5)] = serializeListValue(value);
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}

interface HydrateScriptOptions {
  renderer: any;
  astroId: string;
  props: Record<string | number, any>;
}

/** For hydrated components, generate a <script type="module"> to load the component */
export async function generateHydrateScript(scriptOptions: HydrateScriptOptions, metadata: Required<AstroComponentMetadata>): Promise<SSRElement> {
  const { renderer, astroId, props } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;

  if (!componentExport) {
    throw new Error(`Unable to resolve a componentExport for "${metadata.displayName}"! Please open an issue.`);
  }

  let hydrationSource = '';
  if (renderer.hydrationPolyfills) {
    hydrationSource += `await Promise.all([${renderer.hydrationPolyfills.map((src: string) => `\n  import("${src}")`).join(', ')}]);\n`;
  }

  hydrationSource += renderer.source
    ? `const [{ ${componentExport.value}: Component }, { default: hydrate }] = await Promise.all([import("${componentUrl}"), import("${renderer.source}")]);
  return (el, children) => hydrate(el)(Component, ${serializeProps(props)}, children);
`
    : `await import("${componentUrl}");
  return () => {};
`;

  const hydrationScript = {
    props: { type: 'module', 'data-astro-component-hydration': true },
    children: `import setup from 'astro/client/${hydrate}.js';
setup("${astroId}", {${metadata.hydrateArgs ? `value: ${JSON.stringify(metadata.hydrateArgs)}` : ''}}, async () => {
  ${hydrationSource}
});
`,
  };

  return hydrationScript;
}
