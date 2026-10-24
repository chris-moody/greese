#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadData } from './data.ts'
import { createGreeseServer } from './server.ts'

// stdout carries the protocol: anything else goes to stderr.
await createGreeseServer(loadData()).connect(new StdioServerTransport())
console.error('GreeseUI MCP server running on stdio')
