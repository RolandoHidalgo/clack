import { Writable } from 'node:stream';
import { getColumns } from '@skidrow/clack-fork-core';
import color from 'picocolors';
import { erase } from 'sisteransi';
import { isCI as isCIFn, isTTY as isTTYFn, S_BAR, S_STEP_SUBMIT } from './common.js';
import { log } from './log.js';
import { spinner2 } from './spinner2.js';
import type {
	BufferEntry,
	TaskLogCompletionOptions,
	TaskLogMessageOptions,
	TaskLogOptions,
} from './task-log.js';

const stripDestructiveANSI = (input: string): string => {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional
	return input.replace(/\x1b\[(?:\d+;)*\d*[ABCDEFGHfJKSTsu]|\x1b\[(s|u)/g, '');
};

class StringWriter extends Writable {
	private buffer: string;
	private logger: (msg: string) => void;

	constructor(logger: (msg: string) => void, options = {}) {
		super(options);
		this.buffer = '';
		this.logger = logger;
	}

	_write(chunk: string, _encoding: string, callback: () => void) {
		this.buffer += chunk.toString();
		//console.log(this.buffer)
		this.logger(chunk.toString());
		//this.logger.refresh();
		callback();
	}

	// método auxiliar para obtener el contenido acumulado
	toString() {
		return this.buffer;
	}
}

/**
 * Renders a log which clears on success and remains on failure
 */
export const multiTasker = (opts: TaskLogOptions) => {
	const output: Writable = opts.output ?? process.stdout;
	const columns = getColumns(output);
	const secondarySymbol = color.gray(S_BAR);
	const spacing = opts.spacing ?? 1;
	const barSize = 3;
	const retainLog = opts.retainLog === true;
	const isTTY = !isCIFn() && isTTYFn(output);

	output.write(`${secondarySymbol}\n`);
	output.write(`${color.green(S_STEP_SUBMIT)}  ${opts.title}\n`);
	for (let i = 0; i < spacing; i++) {
		output.write(`${secondarySymbol}\n`);
	}

	const buffers: BufferEntry[] = [
		{
			value: '',
			full: '',
		},
	];
	let lastMessageWasRaw = false;

	const clear = (clearTitle: boolean): void => {
		if (buffers.length === 0) {
			return;
		}

		let lines = 0;

		if (clearTitle) {
			lines += spacing + 2;
		}
		//console.log(lines,'antes del for');
		//console.log(buffers,'buffers antes del for');
		for (const buffer of buffers) {
			const { value, result } = buffer;
			let text = result?.message ?? value;

			if (text.length === 0) {
				//console.log('text blanco ignoro');
				continue;
			}
			//console.log('no texto en blanco no ignoro',buffer);
			if (result === undefined && buffer.header !== undefined && buffer.header !== '') {
				text += `\n${buffer.header}`;
			}

			if (result === undefined && buffer.taskHeader !== undefined && buffer.taskHeader !== '') {
				text += `\n${buffer.taskHeader}`;
			}

			const bufferHeight = text.split('\n').reduce((count, line) => {
				if (line === '') {
					return count + 1;
				}
				return count + Math.ceil((line.length + barSize) / columns);
			}, 0);

			lines += bufferHeight;
		}

		if (lines > 0) {
			lines += 1;
			output.write(erase.lines(lines));
		}
	};
	const printBuffer = (buffer: BufferEntry, messageSpacing?: number, full?: boolean): void => {
		const messages = full ? `${buffer.full}\n${buffer.value}` : buffer.value;
		if (buffer.header !== undefined && buffer.header !== '') {
			log.message(buffer.header.split('\n').map(color.bold), {
				output,
				secondarySymbol,
				symbol: secondarySymbol,
				spacing: 0,
			});
		}
		if (buffer.taskHeader !== undefined && buffer.taskHeader !== '') {
			log.message(buffer.taskHeader.split('\n').map(color.magenta), {
				output,
				secondarySymbol,
				symbol: secondarySymbol,
				spacing: 0,
			});
		}

		log.message(messages.split('\n').map(color.dim), {
			output,
			secondarySymbol,
			symbol: secondarySymbol,
			spacing: messageSpacing ?? spacing,
		});
	};
	const renderBuffer = (): void => {
		for (const buffer of buffers) {
			const { header, value, full } = buffer;
			if ((header === undefined || header.length === 0) && value.length === 0) {
				continue;
			}
			printBuffer(buffer, undefined, retainLog === true && full.length > 0);
		}
	};
	const message = (
		buffer: BufferEntry,
		msg: string,
		mopts?: TaskLogMessageOptions,
		force = false
	) => {
		//console.log('mensagge',buffer,msg)
		clear(false);
		//console.log('desp del clear')

		if ((mopts?.raw !== true || !lastMessageWasRaw) && buffer.value !== '') {
			buffer.value += '\n';
		}
		if (force) {
			buffer.value = '';
			buffer.full = '';
			//buffers[0].value += color.green(buffer.taskHeader+" done\n");
		}
		buffer.value += stripDestructiveANSI(msg);

		lastMessageWasRaw = mopts?.raw === true;
		//console.log('verificar si hay que omitir lineas');
		if (opts.limit !== undefined) {
			const lines = buffer.value.split('\n');
			const linesToRemove = lines.length - opts.limit;
			if (linesToRemove > 0) {
				const removedLines = lines.splice(0, linesToRemove);
				if (retainLog) {
					buffer.full += (buffer.full === '' ? '' : '\n') + removedLines.join('\n');
				}
			}
			buffer.value = lines.join('\n');
		}
		if (isTTY) {
			printBuffers();
		}
	};
	const printBuffers = (): void => {
		//console.log('print bufferssssss');
		for (const buffer of buffers) {
			if (buffer.result) {
				if (buffer.result.status === 'error') {
					log.error(buffer.result.message, { output, secondarySymbol, spacing: 0 });
				} else {
					log.success(buffer.result.message, { output, secondarySymbol, spacing: 0 });
				}
			} else if (buffer.value !== '') {
				printBuffer(buffer, 0);
			}
		}
	};
	const completeBuffer = (buffer: BufferEntry, result: BufferEntry['result']): void => {
		clear(false);

		buffer.result = result;

		if (isTTY) {
			printBuffers();
		}
	};

	return {
		message(msg: string, mopts?: TaskLogMessageOptions) {
			message(buffers[0], msg, mopts);
		},
		addGroup(name: string) {
			const buffer: BufferEntry = {
				header: name,
				value: '',
				full: '',
			};

			buffers.push(buffer);
			return {
				addTask(title: string) {
					let isNewTask = buffer.taskHeader !== undefined && buffer.taskHeader !== '';

					buffer.taskHeader = title;

					return {
						message(msg: string, mopts?: TaskLogMessageOptions) {
							message(buffer, msg, mopts, isNewTask);
							isNewTask = false;
						},
						limpiar() {
							clear(false);
						},
						error(message: string) {
							completeBuffer(buffer, {
								status: 'error',
								message,
							});
						},
						success(message: string) {
							completeBuffer(buffer, {
								status: 'success',
								message,
							});
						},
					};
				},
				addProgress(title: string) {
					//let isNewTask = buffer.taskHeader !== undefined && buffer.taskHeader !== '';

					buffer.taskHeader = title;

					const sw = new StringWriter((msg) => {
						message(buffer, msg, undefined, true);
					});
					const s = spinner2({
						output: sw,
					});
					return {
						start(msg: string) {
							s.start(msg);
						},
						stop(msg: string) {
							s.stop(msg);
						},
						message(msg: string, _mopts?: TaskLogMessageOptions) {
							s.message(msg);
							//isNewTask = false;
						},
						limpiar() {
							clear(false);
						},
						error(message: string) {
							completeBuffer(buffer, {
								status: 'error',
								message,
							});
						},
						success(message: string) {
							completeBuffer(buffer, {
								status: 'success',
								message,
							});
						},
					};
				},
			};
		},
		error(message: string, opts?: TaskLogCompletionOptions): void {
			clear(true);
			log.error(message, { output, secondarySymbol, spacing: 1 });
			if (opts?.showLog !== false) {
				renderBuffer();
			}
			// clear buffer since error is an end state
			buffers.splice(1, buffers.length - 1);
			buffers[0].value = '';
			buffers[0].full = '';
		},
		success(message: string, opts?: TaskLogCompletionOptions): void {
			clear(true);
			log.success(message, { output, secondarySymbol, spacing: 1 });
			if (opts?.showLog === true) {
				renderBuffer();
			}
			// clear buffer since success is an end state
			buffers.splice(1, buffers.length - 1);
			buffers[0].value = '';
			buffers[0].full = '';
		},
	};
};
