//  Your first serverless function.
//
//  On Vercel, every file inside the top-level /api folder becomes its own
//  serverless function, and the FILE PATH becomes the URL:
//      api/hello.js   ->   /api/hello
//
//  The default-exported function is the "handler". Vercel runs it fresh for
//  each incoming request and hands you two objects:
//      req  - the incoming request (method, headers, query, body)
//      res  - how you reply (status code + body)
//
//  Remember the core serverless rule: this function keeps NO memory between
//  requests. Anything that must persist (scores, sessions) will live in the
//  database we add next phase -- never in a variable here.
export default function handler (req, res)
{
    res.status(200).json({
        message: 'Hello from your backend!',
        method: req.method
    });
}
