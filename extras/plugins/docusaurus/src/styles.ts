export const picjsStyles = `
.picjs-example {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  margin: 1rem 0;
  padding: 0.5rem 0;
  border-top: 0.5px solid #888;
  border-bottom: 0.5px solid #888;
  background-color: var(--ifm-code-background, #f8f8f8);
}

.picjs-example > * {
  flex: 1 1 0%;
  min-width: 18rem;
}

.picjs-stacked {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 1rem 0;
}

.picjs-source {
  margin: 0;
  padding: 0 1rem;
  overflow-x: auto;
}

.picjs-source code {
  line-height: 1.3;
  font-size: calc(1em - 1pt);
}

.picjs-diagram svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
}

.picjs-error {
  color: var(--ifm-color-danger, #e53935);
  padding: 1rem;
  border: 1px solid currentColor;
  border-radius: 4px;
  margin: 1rem 0;
}
`;
