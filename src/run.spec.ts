import { describe, it, mock } from 'node:test'
import run from './run.js'
import assert from 'node:assert/strict'
import os from 'node:os'

void describe('run()', () => {
	void it('should run a command and return the output', async () => {
		const res = await run({
			command: 'echo',
			args: ['-n', 'test'],
		})

		assert.equal(res, 'test')
	})

	void it('should pass input', async () => {
		const res = await run({
			command: '/bin/bash',
			args: ['-c', 'read input && echo $input'],
			input: `test${os.EOL}`,
		})
		assert.equal(res, `test${os.EOL}`)
	})

	void it('should log the executed command', async () => {
		const debug = mock.fn()
		await run({
			command: 'echo',
			args: ['-n', 'test'],
			log: {
				debug,
			},
		})
		assert.equal(debug.mock.calls[0]?.arguments[0], 'echo -n test')
	})

	void it('should reject if the command does not exist', async () =>
		assert.rejects(
			async () =>
				run({
					command: 'foo',
				}),
			/spawn foo ENOENT/,
		))

	void it('should reject on non-zero exit code', async () =>
		assert.rejects(
			async () =>
				run({
					command: '/bin/bash',
					args: ['-c', 'exit 42'],
				}),
			/\(42\)/,
		))

	void it('should log the errors', async () => {
		const error = mock.fn()
		await run({
			command: 'npx',
			args: ['tsx', 'src/test/stderr.ts'],
			log: {
				stderr: error,
			},
		})
		assert.equal(error.mock.calls[0]?.arguments[0].toString(), 'error')
	})

	void it('should log the output', async () => {
		const log = mock.fn()
		await run({
			command: 'echo',
			args: ['-n', 'test'],
			log: {
				stdout: log,
			},
		})
		assert.equal(log.mock.calls[0]?.arguments[0].toString(), 'test')
	})

	void it('can be launched in a different working directory', async () => {
		await run({
			command: 'npx',
			args: ['tsx', 'stderr.ts'],
			cwd: 'src/test',
		})
	})

	void it('can be passed environment variables', async () => {
		const res = await run({
			command: '/bin/bash',
			args: ['-c', 'echo $FOO'],
			env: {
				FOO: 'bar',
			},
		})
		assert.equal(res, `bar${os.EOL}`)
	})
})
