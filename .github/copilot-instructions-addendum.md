React import style
==================

Policy: Do not use the default `React` import or `React.*` property access in source files. Always import React symbols by name from the `react` package.

Why:
- Modern JSX transforms (used by our build) don't require a default `React` binding. Mixing default and named imports across the codebase can produce runtime errors such as "can't access property 'createContext' of undefined" when a chunk expects a default `React` object that isn't present.
- Using explicit named imports keeps imports small and makes tree-shaking and bundlers behave predictably.

Correct usage examples
- Functional components and hooks:

  import { FC, useEffect, useState } from 'react'

  const MyComponent: FC = () => {
    const [count, setCount] = useState(0)
    useEffect(() => { /* ... */ }, [])
    return <div>{count}</div>
  }

- Contexts:

  import { createContext, useContext } from 'react'

  const MyContext = createContext<MyType | null>(null)

Examples to avoid
- Do not write:

  import React from 'react'

  const Ctx = React.createContext(null)

  or mix default+named like:

  import React, { useState } from 'react'

If you need types, import them by name too (e.g., `FC`, `ChangeEvent`, `ReactNode`).

How to find problematic files
- To find files that still use `React.` or default `React` imports, run:

  grep -RIn "import React from 'react'" frontend/src || true
  grep -RIn "React\." frontend/src || true

Automated codemods may help, but change them in reviewed batches and run `npm run lint` and `npm run build` after each batch.

If you are unsure about a change, create a small PR and run CI; don't push a sweeping commit without verification.
