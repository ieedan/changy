import { assert, test } from 'vitest';
import { type Settings, settingsSchema } from '../src/utils/settings';

test('Catches invalid timezone', () => {
	const settings: Settings = {
		timezone: 'Invalid/TimeZone',
		changeCategories: ['Added', 'Changed', 'Fixed'],
	};

	assert.throws(() => {
		settingsSchema.parse(settings);
	});
});

test('Catches invalid categories', () => {
	const settings: Settings = {
		timezone: 'UTC',
		changeCategories: [],
	};

	assert.throws(() => {
		settingsSchema.parse(settings);
	});
});

test('Allows valid config', () => {
	const settings: Settings = {
		timezone: 'UTC',
		changeCategories: ['Added', 'Changed', 'Fixed'],
	};

	assert.doesNotThrow(() => {
		settingsSchema.parse(settings);
	});
});
