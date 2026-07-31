  export const togglereset = (resetFn, setSelected) => {
    resetFn();
    setSelected({
      branch: null,
      board: null,
      standard: null,
      batch: null
    })
  }
