import { mkdir, writeFile } from 'node:fs/promises';

import { codegen } from '@graphql-codegen/core';
import * as typescript from '@graphql-codegen/typescript';
import * as typescriptResolvers from '@graphql-codegen/typescript-resolvers';
import { parse } from 'graphql';

import { typeDefs } from '../src/graphql/typeDefs.ts';

const output = await codegen({
  filename: 'src/graphql/generated.ts',
  schema: parse(typeDefs),
  documents: [],
  plugins: [
    {
      typescript: {},
    },
    {
      typescriptResolvers: {},
    },
  ],
  pluginMap: {
    typescript,
    typescriptResolvers,
  },
  config: {
    useTypeImports: true,
    enumsAsTypes: true,
    contextType: './context.js#GraphQLContextType',
    mappers: {
      Place: '../locations/geocodedLocation.types.js#GeocodedLocationType',
      ForecastWindow: '../forecasts/forecast.types.js#ForecastWindowType',
      EvaluationWindow: './graphqlModels.types.js#EvaluationWindowType',
      FactorSummary: '../scoring/scoring.types.js#FactorSummaryType',
      DailyAssessment: '../scoring/scoring.types.js#DailyAssessmentType',
      ActivityRanking: '../scoring/scoring.types.js#ActivityRankingType',
      SourceAttribution:
        '../forecasts/activityForecast.types.js#SourceAttributionType',
      ActivityForecast:
        '../forecasts/activityForecast.types.js#ActivityForecastType',
    },
  },
});

await writeFile(
  new URL('../src/graphql/generated.ts', import.meta.url),
  output,
);

const webOutput = await codegen({
  filename: 'generated.ts',
  schema: parse(typeDefs),
  documents: [],
  plugins: [{ typescript: {} }],
  pluginMap: { typescript },
  config: {
    useTypeImports: true,
    enumsAsTypes: true,
  },
});

const webDirectory = new URL('../../web/src/graphql/', import.meta.url);

await mkdir(webDirectory, { recursive: true });
await writeFile(new URL('generated.ts', webDirectory), webOutput);
