"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsers_1 = require("../src/lib/parsers");
function assertCondition(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message !== null && message !== void 0 ? message : `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
}
function assertDeepEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
        throw new Error(message !== null && message !== void 0 ? message : `Expected ${a} to deep-equal ${b}`);
    }
}
const yamlSample = `- id: 1
  name: Alice
  email: alice@example.com
  age: 30
  active: true
- id: 2
  name: Bob
  email: bob@example.com
  age: 25
  active: false`;
const xmlSample = `<users>
  <user>
    <id>1</id>
    <name>Alice</name>
    <email>alice@example.com</email>
    <age>30</age>
    <active>true</active>
  </user>
  <user>
    <id>2</id>
    <name>Bob</name>
    <email>bob@example.com</email>
    <age>25</age>
    <active>false</active>
  </user>
</users>`;
const nestedYaml = `users:
  - id: 1
    name: Alice
    tags:
      - alpha
      - beta
  - id: 2
    name: Bob
    address:
      city: Hangzhou
      zip: 310000`;
const logSample = `time=2025-10-15T14:25:18Z level=INFO message="sync finished" latency_ms=123`;
const tsvSample = 'id\tname\tage\n1\tAlice\t30\n2\tBob\t25';
function testYamlParsing() {
    const result = (0, parsers_1.parseYamlData)(yamlSample);
    assertCondition(Array.isArray(result), 'YAML 应解析为数组');
    assertEqual(result.length, 2);
    assertEqual(result[0].id, 1);
    assertEqual(result[0].active, true);
    assertEqual(result[1].email, 'bob@example.com');
    const nested = (0, parsers_1.parseYamlData)(nestedYaml);
    assertCondition(nested && Array.isArray(nested.users), 'YAML 嵌套应包含 users 数组');
    assertEqual(nested.users.length, 2);
    assertDeepEqual(nested.users[0].tags, ['alpha', 'beta']);
    assertEqual(nested.users[1].address.city, 'Hangzhou');
}
function testFormatDetection() {
    assertEqual((0, parsers_1.detectFormat)(yamlSample), 'yaml');
    assertEqual((0, parsers_1.detectFormat)(xmlSample), 'xml');
    assertEqual((0, parsers_1.detectFormat)(logSample), 'log');
}
function testLogParsing() {
    const records = (0, parsers_1.parseLogData)(logSample);
    assertEqual(records.length, 1);
    assertEqual(records[0].level, 'INFO');
    assertEqual(records[0].latency_ms, 123);
}
function testTsvParsing() {
    const rows = (0, parsers_1.parseDelimitedText)(tsvSample, '\t');
    assertEqual(rows.length, 2);
    assertEqual(rows[1].name, 'Bob');
    assertEqual(rows[1].age, '25');
}
function run() {
    testYamlParsing();
    testFormatDetection();
    testLogParsing();
    testTsvParsing();
    console.log('parser tests passed');
}
run();
