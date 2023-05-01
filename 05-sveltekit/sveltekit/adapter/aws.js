import * as fsex from 'fs-extra';
import * as fs from 'fs';
import * as esbuild from 'esbuild';
import * as path from 'path';

export function adapter(config) {
	return {
		name: 'adapter-aws',
		async adapt(builder) {
			fsex.emptyDirSync(config.buildPath);

			const serverDirectory = path.join(config.buildPath, 'server');
			if (!fs.existsSync(serverDirectory)) {
				fs.mkdirSync(serverDirectory, { recursive: true });
			}

			builder.log.minor('Copying server files.');
			await builder.writeServer(serverDirectory);

			fs.copyFileSync('./adapter/server/lambda.js', `${serverDirectory}/lambda.js`);
			fs.copyFileSync('./adapter/server/shims.js', `${serverDirectory}/shims.js`);

			const lambdaDirectory = path.join(config.buildPath, 'lambda');
			if (!fs.existsSync(lambdaDirectory)) {
				fs.mkdirSync(lambdaDirectory, { recursive: true });
			}

			builder.log.minor('Building AWS Lambda server function.');
			esbuild.buildSync({
				entryPoints: [`${serverDirectory}/lambda.js`],
				outfile: `${lambdaDirectory}/index.js`,
				inject: [path.join(`${serverDirectory}/shims.js`)],
				external: ['node:*'],
				format: 'cjs',
				banner: {},
				bundle: true,
				platform: 'node',
				target: 'node16',
				treeShaking: true
			});

			const staticDirectory = path.join(config.buildPath, 'static');
			if (!fs.existsSync(staticDirectory)) {
				fs.mkdirSync(staticDirectory, { recursive: true });
			}

			builder.log.minor('Copying asset files.');
			await builder.writeClient(staticDirectory);

			builder.log.minor('Prerendering static pages.');
			await builder.writePrerendered(staticDirectory);
		}
	};
}
