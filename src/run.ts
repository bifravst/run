import { spawn } from 'node:child_process'
import os from 'node:os'

const run = async ({
	command,
	args,
	input,
	log,
	cwd,
}: {
	command: string
	args?: string[]
	input?: string
	cwd?: string
	log?: {
		debug?: (...message: string[]) => void
		stdout?: (data: Buffer) => void
		stderr?: (data: Buffer) => void
	}
	onError?: (code: number) => void
}): Promise<string> =>
	new Promise((resolve, reject) => {
		log?.debug?.(`${command} ${args?.join(' ')}`)
		const p = spawn(command, args, { cwd })
		const result = [] as string[]
		const errors = [] as string[]
		if (input !== undefined) {
			p.stdin.write(input)
		}
		p.on('close', (code) => {
			if (code !== 0) {
				return reject(
					new Error(
						`${command} ${args?.join(' ')} failed (${code}): ${errors.join(os.EOL)}`,
					),
				)
			}
			return resolve(result.join(os.EOL))
		})
		p.stdout.on('data', (data) => {
			result.push(data)
			log?.stdout?.(data)
		})
		p.stderr.on('data', (data) => {
			errors.push(data)
			log?.stderr?.(data)
		})
		p.on('error', reject)
	})

export default run
