'use strict';

type Primitives = string | boolean | number | bigint;

interface FieldConstructor {
	get?: object | Primitives | unknown
	set?: unknown
	configurable?: boolean
	enumerable?: boolean
	writeable?: boolean
}

class FieldDescriptorFactory implements FieldConstructor {
	public get get() {
		return this.valueOf();
	}
	public set get(value: unknown) {
		// throw new Error('broken behaviour: assignment to getter');
	}
	public get set() {
		return function (_value: unknown) {
			this.value = _value;
		}
	}
	public set set(value: unknown) {
		// throw new Error('broken behaviour: assignment to setter');
	}
	configurable: false
	enumerable: false
	writeable: false
	constructor(value?: unknown) {
		const self = this;
		Reflect.defineProperty(this, 'value', {
			get() {
				return value;
			},
			set(_value: unknown) {
				value = _value;
			}
		});
		Reflect.defineProperty(this, Symbol.hasInstance, {
			get() {
				return function (entity: object) {
					if ((entity).constructor === this.value.constructor) {
						return true;
					}
				};
			}
		});
		Object.freeze(this);
	}
}


