import { handleRequest } from './_dispatcher.js';

export const onRequest = (context) => handleRequest(context, 'courses');
