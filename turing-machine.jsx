import React, { useState, useEffect, useRef, useCallback } from 'react';

const BLANK = '□';

const examplePrograms = {
  binaryIncrement: {
    name: 'Binary Increment',
    description: 'Adds 1 to a binary number. Try: 1011 → 1100',
    initialTape: '1011',
    startPosition: 3,
    states: ['scan', 'carry', 'done'],
    initialState: 'scan',
    haltStates: ['done'],
    transitions: {
      'scan,0': { write: '0', move: 'R', next: 'scan' },
      'scan,1': { write: '1', move: 'R', next: 'scan' },
      'scan,□': { write: '□', move: 'L', next: 'carry' },
      'carry,0': { write: '1', move: 'L', next: 'done' },
      'carry,1': { write: '0', move: 'L', next: 'carry' },
      'carry,□': { write: '1', move: 'L', next: 'done' },
    }
  },
  binaryDecrement: {
    name: 'Binary Decrement',
    description: 'Subtracts 1 from a binary number. Try: 1100 → 1011',
    initialTape: '1100',
    startPosition: 3,
    states: ['scan', 'borrow', 'done'],
    initialState: 'scan',
    haltStates: ['done'],
    transitions: {
      'scan,0': { write: '0', move: 'R', next: 'scan' },
      'scan,1': { write: '1', move: 'R', next: 'scan' },
      'scan,□': { write: '□', move: 'L', next: 'borrow' },
      'borrow,1': { write: '0', move: 'L', next: 'done' },
      'borrow,0': { write: '1', move: 'L', next: 'borrow' },
    }
  },
  unaryStringCopy: {
    name: 'Unary String Copy',
    description: 'Copies a string of 1s. Try: 111 → 111#111',
    initialTape: '111',
    startPosition: 0,
    states: ['findOne', 'goRight', 'atSep', 'return', 'toStart', 'clean', 'done'],
    initialState: 'findOne',
    haltStates: ['done'],
    transitions: {
      // Find a 1 to copy, mark it X
      'findOne,1': { write: 'X', move: 'R', next: 'goRight' },
      'findOne,X': { write: 'X', move: 'R', next: 'findOne' },
      'findOne,#': { write: '#', move: 'L', next: 'toStart' },
      'findOne,□': { write: '□', move: 'L', next: 'toStart' },
      
      // Go right to find # or end of input
      'goRight,1': { write: '1', move: 'R', next: 'goRight' },
      'goRight,X': { write: 'X', move: 'R', next: 'goRight' },
      'goRight,#': { write: '#', move: 'R', next: 'atSep' },
      'goRight,□': { write: '#', move: 'R', next: 'atSep' },
      
      // Past separator, find end to place Y
      'atSep,Y': { write: 'Y', move: 'R', next: 'atSep' },
      'atSep,□': { write: 'Y', move: 'L', next: 'return' },
      
      // Return left to find the X we marked
      'return,Y': { write: 'Y', move: 'L', next: 'return' },
      'return,#': { write: '#', move: 'L', next: 'return' },
      'return,1': { write: '1', move: 'L', next: 'return' },
      'return,X': { write: 'X', move: 'R', next: 'findOne' },
      
      // Go to start before cleanup
      'toStart,X': { write: 'X', move: 'L', next: 'toStart' },
      'toStart,□': { write: '□', move: 'R', next: 'clean' },
      
      // Clean up: X→1, Y→1, keep #
      'clean,X': { write: '1', move: 'R', next: 'clean' },
      'clean,1': { write: '1', move: 'R', next: 'clean' },
      'clean,#': { write: '#', move: 'R', next: 'clean' },
      'clean,Y': { write: '1', move: 'R', next: 'clean' },
      'clean,□': { write: '□', move: 'L', next: 'done' },
    }
  },
  binaryStringCopy: {
    name: 'Binary String Copy',
    description: 'Copies a binary string. Try: 101 → 101#101',
    initialTape: '101',
    startPosition: 0,
    states: ['find', 'go0', 'go1', 'place0', 'place1', 'return', 'toStart', 'clean', 'done'],
    initialState: 'find',
    haltStates: ['done'],
    transitions: {
      // Find next symbol to copy
      'find,0': { write: 'A', move: 'R', next: 'go0' },
      'find,1': { write: 'B', move: 'R', next: 'go1' },
      'find,A': { write: 'A', move: 'R', next: 'find' },
      'find,B': { write: 'B', move: 'R', next: 'find' },
      'find,#': { write: '#', move: 'L', next: 'toStart' },
      'find,□': { write: '□', move: 'L', next: 'toStart' },
      
      // Go right carrying a 0
      'go0,0': { write: '0', move: 'R', next: 'go0' },
      'go0,1': { write: '1', move: 'R', next: 'go0' },
      'go0,A': { write: 'A', move: 'R', next: 'go0' },
      'go0,B': { write: 'B', move: 'R', next: 'go0' },
      'go0,#': { write: '#', move: 'R', next: 'place0' },
      'go0,□': { write: '#', move: 'R', next: 'place0' },
      
      // Go right carrying a 1
      'go1,0': { write: '0', move: 'R', next: 'go1' },
      'go1,1': { write: '1', move: 'R', next: 'go1' },
      'go1,A': { write: 'A', move: 'R', next: 'go1' },
      'go1,B': { write: 'B', move: 'R', next: 'go1' },
      'go1,#': { write: '#', move: 'R', next: 'place1' },
      'go1,□': { write: '#', move: 'R', next: 'place1' },
      
      // Place a 0 at the end
      'place0,0': { write: '0', move: 'R', next: 'place0' },
      'place0,1': { write: '1', move: 'R', next: 'place0' },
      'place0,□': { write: '0', move: 'L', next: 'return' },
      
      // Place a 1 at the end
      'place1,0': { write: '0', move: 'R', next: 'place1' },
      'place1,1': { write: '1', move: 'R', next: 'place1' },
      'place1,□': { write: '1', move: 'L', next: 'return' },
      
      // Return left to find the marker
      'return,0': { write: '0', move: 'L', next: 'return' },
      'return,1': { write: '1', move: 'L', next: 'return' },
      'return,#': { write: '#', move: 'L', next: 'return' },
      'return,A': { write: 'A', move: 'R', next: 'find' },
      'return,B': { write: 'B', move: 'R', next: 'find' },
      
      // Go to start before cleanup
      'toStart,A': { write: 'A', move: 'L', next: 'toStart' },
      'toStart,B': { write: 'B', move: 'L', next: 'toStart' },
      'toStart,□': { write: '□', move: 'R', next: 'clean' },
      
      // Clean up: A→0, B→1
      'clean,A': { write: '0', move: 'R', next: 'clean' },
      'clean,B': { write: '1', move: 'R', next: 'clean' },
      'clean,0': { write: '0', move: 'R', next: 'clean' },
      'clean,1': { write: '1', move: 'R', next: 'clean' },
      'clean,#': { write: '#', move: 'R', next: 'clean' },
      'clean,□': { write: '□', move: 'L', next: 'done' },
    }
  },
  balancedParens: {
    name: 'Balanced Parens',
    description: 'Checks if parentheses are balanced. Returns Y or N',
    initialTape: '(())',
    startPosition: 0,
    states: ['scan', 'match', 'check', 'yes', 'no'],
    initialState: 'scan',
    haltStates: ['yes', 'no'],
    transitions: {
      // Scan right looking for )
      'scan,(': { write: '(', move: 'R', next: 'scan' },
      'scan,)': { write: 'X', move: 'L', next: 'match' },
      'scan,X': { write: 'X', move: 'R', next: 'scan' },
      'scan,□': { write: '□', move: 'L', next: 'check' },
      
      // Found ), go left to find matching (
      'match,(': { write: 'X', move: 'R', next: 'scan' },
      'match,X': { write: 'X', move: 'L', next: 'match' },
      'match,□': { write: 'N', move: 'R', next: 'no' },
      
      // Check if any ( remain (unmatched)
      'check,X': { write: 'X', move: 'L', next: 'check' },
      'check,(': { write: 'N', move: 'R', next: 'no' },
      'check,□': { write: 'Y', move: 'R', next: 'yes' },
    }
  },
  busyBeaver3: {
    name: 'Busy Beaver (3-state)',
    description: 'The famous Busy Beaver - writes maximum 1s before halting',
    initialTape: '',
    startPosition: 10,
    states: ['A', 'B', 'C', 'HALT'],
    initialState: 'A',
    haltStates: ['HALT'],
    transitions: {
      'A,□': { write: '1', move: 'R', next: 'B' },
      'A,1': { write: '1', move: 'L', next: 'C' },
      'B,□': { write: '1', move: 'L', next: 'A' },
      'B,1': { write: '1', move: 'R', next: 'B' },
      'C,□': { write: '1', move: 'L', next: 'B' },
      'C,1': { write: '1', move: 'R', next: 'HALT' },
    }
  },
  unaryDouble: {
    name: 'Unary Doubler',
    description: 'Doubles a unary number (count of 1s). Try: 111 → 111111',
    initialTape: '111',
    startPosition: 0,
    states: ['mark', 'goRight', 'return', 'clean', 'done'],
    initialState: 'mark',
    haltStates: ['done'],
    transitions: {
      'mark,1': { write: 'X', move: 'R', next: 'goRight' },
      'mark,□': { write: '□', move: 'L', next: 'clean' },
      'mark,X': { write: 'X', move: 'R', next: 'mark' },
      'mark,Y': { write: 'Y', move: 'R', next: 'mark' },
      'goRight,1': { write: '1', move: 'R', next: 'goRight' },
      'goRight,X': { write: 'X', move: 'R', next: 'goRight' },
      'goRight,Y': { write: 'Y', move: 'R', next: 'goRight' },
      'goRight,□': { write: 'Y', move: 'L', next: 'return' },
      'return,1': { write: '1', move: 'L', next: 'return' },
      'return,X': { write: 'X', move: 'L', next: 'return' },
      'return,Y': { write: 'Y', move: 'L', next: 'return' },
      'return,□': { write: '□', move: 'R', next: 'mark' },
      'clean,X': { write: '1', move: 'L', next: 'clean' },
      'clean,Y': { write: '1', move: 'L', next: 'clean' },
      'clean,1': { write: '1', move: 'L', next: 'clean' },
      'clean,□': { write: '□', move: 'R', next: 'done' },
    }
  },
  blank: {
    name: 'Blank (Custom)',
    description: 'Start from scratch - add your own transitions using the editor',
    initialTape: '',
    startPosition: 5,
    states: ['q0', 'q1', 'HALT'],
    initialState: 'q0',
    haltStates: ['HALT'],
    transitions: {}
  }
};

const tutorialSteps = [
  {
    title: 'Welcome to the Turing Machine!',
    content: 'A Turing machine is the theoretical foundation of all modern computers. Despite being incredibly simple, it can compute anything a laptop or supercomputer can. Let\'s learn how it works!',
  },
  {
    title: 'The Infinite Tape',
    content: 'This is the tape - an infinite strip of cells, each holding a symbol. The tape is the machine\'s memory. Click any cell to edit its contents, or use the Quick Tape Input to set the whole tape at once. The □ symbol represents a blank cell.',
  },
  {
    title: 'The Read/Write Head',
    content: 'The purple HEAD marker shows which cell the machine is currently reading. On each step, it reads this cell, potentially writes a new symbol, then moves left or right.',
  },
  {
    title: 'States (The Machine\'s "Mind")',
    content: 'The machine is always in exactly one state - like its current "mode" of thinking. The highlighted state is active. Check the box to make a state a halt state. Click × to delete unused states.',
  },
  {
    title: 'Transition Rules',
    content: 'These rules are the machine\'s program. Each rule says: "If I\'m in STATE and I read SYMBOL, then WRITE this, MOVE left/right, and go to NEXT state." Use the dropdowns to select states.',
  },
  {
    title: 'Controls & Keyboard Shortcuts',
    content: 'Use Step to execute one rule at a time. Keyboard shortcuts: Space=Step, Enter=Run/Pause, R=Reset, ←/→=History navigation. The speed slider controls continuous execution speed.',
  },
  {
    title: 'Execution Log & History',
    content: 'The execution log shows every step in detail. The history slider lets you rewind and replay. Click any log entry to jump to that point in time!',
  },
  {
    title: 'Import/Export & Build Your Own',
    content: 'Use Import/Export to save your programs as JSON text - copy it, share it, paste it back later. Select "Blank (Custom)" to start fresh and create your own Turing machine!',
  },
];

const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  
  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x, y;
      
      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 8;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 8;
          break;
        case 'left':
          x = rect.left - 8;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 8;
          y = rect.top + rect.height / 2;
          break;
        default:
          x = rect.left + rect.width / 2;
          y = rect.top - 8;
      }
      
      setCoords({ x, y });
    }
    setShow(true);
  };

  const getTooltipStyle = () => {
    const base = {
      position: 'fixed',
      background: '#1a1a1c',
      border: '1px solid #8c7ae6',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 12,
      color: '#e9e9ea',
      zIndex: 9999,
      maxWidth: 250,
      whiteSpace: 'normal',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      pointerEvents: 'none',
    };

    switch (position) {
      case 'top':
        return { ...base, left: coords.x, top: coords.y, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { ...base, left: coords.x, top: coords.y, transform: 'translate(-50%, 0)' };
      case 'left':
        return { ...base, left: coords.x, top: coords.y, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { ...base, left: coords.x, top: coords.y, transform: 'translate(0, -50%)' };
      default:
        return { ...base, left: coords.x, top: coords.y, transform: 'translate(-50%, -100%)' };
    }
  };

  return (
    <div 
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div style={getTooltipStyle()}>
          {text}
        </div>
      )}
    </div>
  );
};

const TutorialOverlay = ({ step, onNext, onPrev, onClose, total, current }) => {
  if (!step) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#27272a',
        borderRadius: 12,
        padding: 24,
        maxWidth: 450,
        border: '2px solid #8c7ae6',
        boxShadow: '0 8px 32px rgba(140, 122, 230, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h3 style={{ color: '#8c7ae6', margin: 0, fontSize: 18 }}>{step.title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>
        <p style={{ color: '#a1a1a8', lineHeight: 1.6, marginBottom: 20 }}>
          {step.content}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#666', fontSize: 12 }}>
            {current + 1} of {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {current > 0 && (
              <button
                onClick={onPrev}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #393941',
                  borderRadius: 6,
                  color: '#e9e9ea',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={current < total - 1 ? onNext : onClose}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #8c7ae6 0%, #6c5ce7 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {current < total - 1 ? 'Next →' : 'Start Exploring!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HelpIcon = ({ tooltip }) => (
  <Tooltip text={tooltip} position="top">
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#393941',
      color: '#8c7ae6',
      fontSize: 10,
      fontWeight: 'bold',
      cursor: 'help',
      marginLeft: 6,
    }}>
      ?
    </span>
  </Tooltip>
);

const TapeCell = ({ symbol, isHead, isWriting, index, onEdit, onMoveHead, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(symbol);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(symbol);
  }, [symbol]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = () => {
    if (!disabled) {
      if (isHead) {
        setEditing(true);
      } else {
        // Click on non-head cell moves the head there
        onMoveHead(index);
      }
    }
  };

  const handleDoubleClick = () => {
    if (!disabled) {
      setEditing(true);
    }
  };

  const handleBlur = () => {
    setEditing(false);
    const newSymbol = value.trim() || BLANK;
    onEdit(index, newSymbol.charAt(0));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(symbol);
      setEditing(false);
    }
  };

  const tooltipText = isHead 
    ? "Click to edit symbol, or use ← → buttons to move head"
    : "Click to move head here. Double-click to edit.";

  const cellContent = (
    <div 
      style={{
        width: 48,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        border: `2px solid ${isHead ? '#8c7ae6' : '#393941'}`,
        borderRadius: 8,
        background: isHead 
          ? 'linear-gradient(180deg, #3d3656 0%, #2a2440 100%)' 
          : '#27272a',
        color: isHead ? '#a192ea' : symbol === BLANK ? '#555' : '#e9e9ea',
        transition: 'all 0.2s ease',
        transform: isWriting ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isHead ? '0 0 20px rgba(140, 122, 230, 0.4)' : 'none',
        flexShrink: 0,
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
      }} 
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: 30,
            height: 30,
            textAlign: 'center',
            fontSize: 20,
            fontFamily: 'monospace',
            background: '#1a1a1c',
            border: '1px solid #8c7ae6',
            borderRadius: 4,
            color: '#e9e9ea',
            outline: 'none',
          }}
          maxLength={1}
        />
      ) : (
        symbol
      )}
      <div style={{
        position: 'absolute',
        bottom: -20,
        fontSize: 10,
        color: '#666',
        fontWeight: 'normal'
      }}>
        {index}
      </div>
    </div>
  );

  if (!disabled) {
    return (
      <Tooltip text={tooltipText} position="bottom">
        {cellContent}
      </Tooltip>
    );
  }
  
  return cellContent;
};

const Head = () => (
  <Tooltip text="The HEAD reads the current cell, writes a symbol, then moves left or right based on the transition rules." position="top">
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'absolute',
      top: -45,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      cursor: 'help',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #8c7ae6 0%, #6c5ce7 100%)',
        padding: '4px 12px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        boxShadow: '0 4px 15px rgba(140, 122, 230, 0.5)',
      }}>
        HEAD
      </div>
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '12px solid #6c5ce7',
      }} />
    </div>
  </Tooltip>
);

const StateNode = ({ state, isCurrent, isHalt, isInTransitions, onToggleHalt, onDelete, onClick, disabled }) => {
  const tooltipText = isCurrent 
    ? `Current state. The machine is "thinking" in ${state} mode.`
    : isHalt 
      ? `Halt state. The machine stops when it enters ${state}.`
      : `Click to set ${state} as the current state.`;

  const canDelete = !isCurrent && !isInTransitions;
  const deleteTooltip = isCurrent 
    ? `Can't delete: this is the current state. Click another state first.`
    : isInTransitions
      ? `Can't delete: this state is used in transition rules.`
      : `Delete state "${state}"`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <Tooltip text={tooltipText} position="top">
        <div 
          onClick={() => !disabled && onClick(state)}
          style={{
            padding: '8px 12px',
            borderRadius: 20,
            background: isCurrent 
              ? 'linear-gradient(135deg, #8c7ae6 0%, #6c5ce7 100%)'
              : isHalt 
                ? '#2d4a3d'
                : '#27272a',
            border: `2px solid ${isCurrent ? '#a192ea' : isHalt ? '#4ade80' : '#393941'}`,
            color: isCurrent ? '#fff' : isHalt ? '#4ade80' : '#a1a1a8',
            fontSize: 13,
            fontWeight: isCurrent ? 'bold' : 'normal',
            transition: 'all 0.3s ease',
            boxShadow: isCurrent ? '0 0 20px rgba(140, 122, 230, 0.5)' : 'none',
            cursor: disabled ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Tooltip text={isHalt ? "Uncheck to make this a regular state" : "Check to make this a halt state"} position="top">
            <input
              type="checkbox"
              checked={isHalt}
              onChange={(e) => {
                e.stopPropagation();
                onToggleHalt(state);
              }}
              disabled={disabled}
              style={{
                width: 14,
                height: 14,
                cursor: disabled ? 'default' : 'pointer',
                accentColor: '#4ade80',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
          {state}
        </div>
      </Tooltip>
      <Tooltip text={deleteTooltip} position="top">
        <button
          onClick={() => canDelete && !disabled && onDelete(state)}
          style={{
            background: 'transparent',
            border: 'none',
            color: canDelete ? '#e25f73' : '#444',
            cursor: canDelete && !disabled ? 'pointer' : 'not-allowed',
            fontSize: 14,
            padding: '4px',
            opacity: disabled ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </Tooltip>
    </div>
  );
};

const TransitionEditor = ({ transitions, states, onUpdate, onDelete, onAdd, currentState, currentSymbol }) => {
  const [newTransition, setNewTransition] = useState({
    state: '',
    symbol: '',
    write: '',
    move: 'R',
    next: ''
  });

  const inputStyle = {
    padding: '4px 8px',
    background: '#1a1a1c',
    border: '1px solid #393941',
    borderRadius: 4,
    color: '#e9e9ea',
    fontSize: 12,
    fontFamily: 'monospace',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const handleAdd = () => {
    if (newTransition.state && newTransition.symbol && newTransition.write && newTransition.next) {
      onAdd(newTransition);
      setNewTransition({ state: '', symbol: '', write: '', move: 'R', next: '' });
    }
  };

  return (
    <div style={{
      background: '#232334',
      borderRadius: 8,
      padding: 12,
      fontSize: 12,
      fontFamily: 'monospace',
      maxHeight: 250,
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 45px 45px 45px 80px 24px',
        gap: 4,
        marginBottom: 8,
        color: '#8c7ae6',
        fontWeight: 'bold',
        borderBottom: '1px solid #393941',
        paddingBottom: 8,
      }}>
        <Tooltip text="The state the machine must be in for this rule to apply" position="top">
          <span style={{ cursor: 'help' }}>State</span>
        </Tooltip>
        <Tooltip text="The symbol that must be under the HEAD" position="top">
          <span style={{ cursor: 'help' }}>Read</span>
        </Tooltip>
        <Tooltip text="The symbol to write to the tape" position="top">
          <span style={{ cursor: 'help' }}>Write</span>
        </Tooltip>
        <Tooltip text="Direction to move: L(eft) or R(ight)" position="top">
          <span style={{ cursor: 'help' }}>Move</span>
        </Tooltip>
        <Tooltip text="The state to transition to" position="top">
          <span style={{ cursor: 'help' }}>Next</span>
        </Tooltip>
        <span></span>
      </div>
      
      {Object.entries(transitions).map(([key, val]) => {
        const [state, symbol] = key.split(',');
        const isActive = state === currentState && symbol === currentSymbol;
        return (
          <div key={key} style={{
            display: 'grid',
            gridTemplateColumns: '80px 45px 45px 45px 80px 24px',
            gap: 4,
            padding: '4px 0',
            alignItems: 'center',
            background: isActive ? 'rgba(140, 122, 230, 0.2)' : 'transparent',
            borderRadius: 4,
            transition: 'background 0.2s',
          }}>
            <span style={{ color: isActive ? '#a192ea' : '#a1a1a8', paddingLeft: 4 }}>{state}</span>
            <span style={{ color: '#4ade80', paddingLeft: 4 }}>{symbol}</span>
            <input
              value={val.write}
              onChange={(e) => onUpdate(key, { ...val, write: e.target.value.charAt(0) || BLANK })}
              style={{ ...inputStyle, width: 36 }}
              maxLength={1}
            />
            <select
              value={val.move}
              onChange={(e) => onUpdate(key, { ...val, move: e.target.value })}
              style={{ ...selectStyle, width: 40 }}
            >
              <option value="L">L</option>
              <option value="R">R</option>
            </select>
            <select
              value={val.next}
              onChange={(e) => onUpdate(key, { ...val, next: e.target.value })}
              style={{ ...selectStyle, width: 72 }}
            >
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Tooltip text="Delete this transition rule" position="left">
              <button
                onClick={() => onDelete(key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#e25f73',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </Tooltip>
          </div>
        );
      })}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 45px 45px 45px 80px 24px',
        gap: 4,
        padding: '8px 0',
        borderTop: '1px solid #393941',
        marginTop: 8,
        alignItems: 'center',
      }}>
        <select
          value={newTransition.state}
          onChange={(e) => setNewTransition({ ...newTransition, state: e.target.value })}
          style={{ ...selectStyle, width: 72 }}
        >
          <option value="" disabled>from...</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="□"
          value={newTransition.symbol}
          onChange={(e) => setNewTransition({ ...newTransition, symbol: e.target.value.charAt(0) })}
          style={{ ...inputStyle, width: 36 }}
          maxLength={1}
        />
        <input
          placeholder="□"
          value={newTransition.write}
          onChange={(e) => setNewTransition({ ...newTransition, write: e.target.value.charAt(0) })}
          style={{ ...inputStyle, width: 36 }}
          maxLength={1}
        />
        <select
          value={newTransition.move}
          onChange={(e) => setNewTransition({ ...newTransition, move: e.target.value })}
          style={{ ...selectStyle, width: 40 }}
        >
          <option value="L">L</option>
          <option value="R">R</option>
        </select>
        <select
          value={newTransition.next}
          onChange={(e) => setNewTransition({ ...newTransition, next: e.target.value })}
          style={{ ...selectStyle, width: 72 }}
        >
          <option value="" disabled>to...</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Tooltip text="Add this new transition rule" position="left">
          <button
            onClick={handleAdd}
            style={{
              background: '#4ade80',
              border: 'none',
              color: '#1a1a1c',
              cursor: 'pointer',
              fontSize: 14,
              borderRadius: 4,
              fontWeight: 'bold',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const HistorySlider = ({ history, currentIndex, onSeek, disabled }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <Tooltip text="Jump to beginning (Home)" position="top">
        <button
          onClick={() => onSeek(0)}
          disabled={disabled || currentIndex <= 0}
          style={{
            background: 'transparent',
            border: '1px solid #393941',
            color: currentIndex <= 0 ? '#555' : '#e9e9ea',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: currentIndex <= 0 ? 'default' : 'pointer',
            fontSize: 12,
          }}
        >
          ⏮
        </button>
      </Tooltip>
      <Tooltip text="Go back one step (←)" position="top">
        <button
          onClick={() => onSeek(Math.max(0, currentIndex - 1))}
          disabled={disabled || currentIndex <= 0}
          style={{
            background: 'transparent',
            border: '1px solid #393941',
            color: currentIndex <= 0 ? '#555' : '#e9e9ea',
            borderRadius: 4,
            padding: '4px 12px',
            cursor: currentIndex <= 0 ? 'default' : 'pointer',
            fontSize: 16,
          }}
        >
          ◀
        </button>
      </Tooltip>
      <div style={{ flex: 1 }}>
        <input
          type="range"
          min={0}
          max={Math.max(0, history.length - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={disabled || history.length === 0}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>
      <Tooltip text="Go forward one step (→)" position="top">
        <button
          onClick={() => onSeek(Math.min(history.length - 1, currentIndex + 1))}
          disabled={disabled || currentIndex >= history.length - 1}
          style={{
            background: 'transparent',
            border: '1px solid #393941',
            color: currentIndex >= history.length - 1 ? '#555' : '#e9e9ea',
            borderRadius: 4,
            padding: '4px 12px',
            cursor: currentIndex >= history.length - 1 ? 'default' : 'pointer',
            fontSize: 16,
          }}
        >
          ▶
        </button>
      </Tooltip>
      <Tooltip text="Jump to end (End)" position="top">
        <button
          onClick={() => onSeek(history.length - 1)}
          disabled={disabled || currentIndex >= history.length - 1}
          style={{
            background: 'transparent',
            border: '1px solid #393941',
            color: currentIndex >= history.length - 1 ? '#555' : '#e9e9ea',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: currentIndex >= history.length - 1 ? 'default' : 'pointer',
            fontSize: 12,
          }}
        >
          ⏭
        </button>
      </Tooltip>
    </div>
  );
};

const ExecutionLog = ({ history, currentIndex, onSeek }) => {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      const activeItem = logRef.current.querySelector(`[data-index="${currentIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  return (
    <div
      ref={logRef}
      style={{
        background: '#232334',
        borderRadius: 8,
        padding: 8,
        fontSize: 11,
        fontFamily: 'monospace',
        maxHeight: 150,
        overflowY: 'auto',
      }}
    >
      {history.length === 0 && (
        <div style={{ color: '#666', padding: 8, textAlign: 'center' }}>
          No steps yet. Press Step or Run to begin.
        </div>
      )}
      {history.map((h, i) => (
        <div
          key={i}
          data-index={i}
          onClick={() => onSeek(i)}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            background: i === currentIndex ? 'rgba(140, 122, 230, 0.2)' : 'transparent',
            borderLeft: i === currentIndex ? '2px solid #8c7ae6' : '2px solid transparent',
            marginBottom: 2,
          }}
        >
          {i === 0 ? (
            <span style={{ color: '#666' }}>
              <span style={{ color: '#e67e22' }}>0.</span> Initial state: <span style={{ color: '#8c7ae6' }}>{h.currentState}</span> at position <span style={{ color: '#e67e22' }}>{h.headPosition}</span>
            </span>
          ) : h.action ? (
            <span style={{ color: '#a1a1a8' }}>
              <span style={{ color: '#e67e22' }}>{i}.</span>{' '}
              <span style={{ color: '#8c7ae6' }}>{h.action.from}</span>{' '}
              <span style={{ color: '#4ade80' }}>'{h.action.read}'</span>
              {' → '}
              <span style={{ color: '#f472b6' }}>'{h.action.write}'</span>{' '}
              <span style={{ color: '#60a5fa' }}>{h.action.move}</span>{' '}
              <span style={{ color: '#8c7ae6' }}>{h.action.to}</span>
            </span>
          ) : (
            <span style={{ color: '#666' }}>
              <span style={{ color: '#e67e22' }}>{i}.</span> State: <span style={{ color: '#8c7ae6' }}>{h.currentState}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const ImportExportModal = ({ isOpen, onClose, programData, onImport }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(JSON.stringify(programData, null, 2));
      setError('');
    }
  }, [isOpen, programData]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(text);
      // Validate required fields
      if (!parsed.states || !parsed.initialState || !parsed.transitions) {
        throw new Error('Missing required fields: states, initialState, transitions');
      }
      if (!parsed.haltStates) {
        parsed.haltStates = [];
      }
      if (parsed.startPosition === undefined) {
        parsed.startPosition = 0;
      }
      if (!parsed.initialTape) {
        parsed.initialTape = '';
      }
      onImport(parsed);
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#27272a',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 600,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #8c7ae6',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h3 style={{ color: '#8c7ae6', margin: 0, fontSize: 18 }}>Import / Export Program</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>
        <p style={{ color: '#a1a1a8', fontSize: 13, marginBottom: 12 }}>
          Copy this JSON to save your program, or paste JSON to load a program.
        </p>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          style={{
            flex: 1,
            minHeight: 300,
            background: '#1a1a1c',
            border: '1px solid #393941',
            borderRadius: 8,
            padding: 12,
            color: '#e9e9ea',
            fontSize: 12,
            fontFamily: 'monospace',
            resize: 'none',
          }}
        />
        {error && (
          <div style={{ color: '#e25f73', fontSize: 12, marginTop: 8 }}>
            Error: {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { navigator.clipboard.writeText(text); }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #393941',
              borderRadius: 6,
              color: '#e9e9ea',
              cursor: 'pointer',
            }}
          >
            📋 Copy
          </button>
          <button
            onClick={handleImport}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#1a1a1c',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TuringMachine() {
  const [program, setProgram] = useState(examplePrograms.binaryIncrement);
  const [tape, setTape] = useState({});
  const [headPosition, setHeadPosition] = useState(0);
  const [currentState, setCurrentState] = useState('');
  const [haltStates, setHaltStates] = useState(new Set());
  const [transitions, setTransitions] = useState({});
  const [states, setStates] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isHalted, setIsHalted] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [stepCount, setStepCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [newStateName, setNewStateName] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [quickTapeInput, setQuickTapeInput] = useState('');
  const [quickHeadPos, setQuickHeadPos] = useState('0');
  const [showImportExport, setShowImportExport] = useState(false);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const initializeTape = useCallback((prog) => {
    const newTape = {};
    const input = prog.initialTape;
    for (let i = 0; i < input.length; i++) {
      newTape[i] = input[i];
    }
    setTape(newTape);
    setHeadPosition(prog.startPosition);
    setCurrentState(prog.initialState);
    setHaltStates(new Set(prog.haltStates));
    setTransitions({ ...prog.transitions });
    setStates([...prog.states]);
    setIsHalted(false);
    setStepCount(0);
    setHistory([{
      tape: { ...newTape },
      headPosition: prog.startPosition,
      currentState: prog.initialState,
      action: null,
    }]);
    setHistoryIndex(0);
    setLastAction(null);
    setQuickTapeInput(prog.initialTape);
    setQuickHeadPos(String(prog.startPosition));
  }, []);

  useEffect(() => {
    initializeTape(program);
  }, [program, initializeTape]);

  const getTapeSymbol = (pos, tapeData = tape) => tapeData[pos] || BLANK;

  const getStatesInTransitions = useCallback(() => {
    const inUse = new Set();
    Object.entries(transitions).forEach(([key, val]) => {
      const [state] = key.split(',');
      inUse.add(state);
      inUse.add(val.next);
    });
    return inUse;
  }, [transitions]);

  const step = useCallback(() => {
    if (isHalted) return false;

    const symbol = getTapeSymbol(headPosition);
    const key = `${currentState},${symbol}`;
    
    let transition = transitions[key];

    if (!transition) {
      setIsHalted(true);
      setLastAction({ type: 'halt', reason: 'No transition found' });
      return false;
    }

    setIsWriting(true);
    setTimeout(() => setIsWriting(false), 150);

    const newTape = { ...tape, [headPosition]: transition.write };
    const newHeadPosition = headPosition + (transition.move === 'R' ? 1 : -1);
    const newState = transition.next;

    setTape(newTape);
    setHeadPosition(newHeadPosition);
    setCurrentState(newState);
    setStepCount(prev => prev + 1);
    
    const actionRecord = {
      read: symbol,
      write: transition.write,
      move: transition.move,
      from: currentState,
      to: newState,
    };
    
    setLastAction({ type: 'step', ...actionRecord });

    const newHistoryEntry = {
      tape: { ...newTape },
      headPosition: newHeadPosition,
      currentState: newState,
      action: actionRecord,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newHistoryEntry);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);

    if (haltStates.has(newState)) {
      setIsHalted(true);
      return false;
    }

    return true;
  }, [headPosition, currentState, tape, transitions, isHalted, historyIndex, haltStates]);

  useEffect(() => {
    if (isRunning && !isHalted) {
      intervalRef.current = setInterval(() => {
        const canContinue = step();
        if (!canContinue) {
          setIsRunning(false);
        }
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isHalted, step, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!isRunning && !isHalted) step();
          break;
        case 'Enter':
          e.preventDefault();
          if (isRunning) {
            setIsRunning(false);
          } else if (!isHalted) {
            setIsRunning(true);
          }
          break;
        case 'KeyR':
          e.preventDefault();
          setIsRunning(false);
          initializeTape(program);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isRunning && historyIndex > 0) {
            handleSeek(historyIndex - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isRunning && historyIndex < history.length - 1) {
            handleSeek(historyIndex + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          if (!isRunning) handleSeek(0);
          break;
        case 'End':
          e.preventDefault();
          if (!isRunning) handleSeek(history.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isHalted, step, historyIndex, history.length, program, initializeTape]);

  const handleRun = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStep = () => {
    if (!isRunning) step();
  };
  const handleReset = () => {
    setIsRunning(false);
    initializeTape(program);
  };

  const handleSeek = (index) => {
    if (index >= 0 && index < history.length) {
      const snapshot = history[index];
      setTape({ ...snapshot.tape });
      setHeadPosition(snapshot.headPosition);
      setCurrentState(snapshot.currentState);
      setHistoryIndex(index);
      setStepCount(index);
      setLastAction(snapshot.action ? { type: 'step', ...snapshot.action } : null);
      setIsHalted(haltStates.has(snapshot.currentState));
    }
  };

  const handleTapeEdit = (index, symbol) => {
    if (!isRunning) {
      const newTape = { ...tape, [index]: symbol === '' ? BLANK : symbol };
      setTape(newTape);
      
      setHistory([{
        tape: { ...newTape },
        headPosition,
        currentState,
        action: null,
      }]);
      setHistoryIndex(0);
      setStepCount(0);
      setIsHalted(false);
    }
  };

  const handleMoveHead = (newPos) => {
    if (!isRunning) {
      setHeadPosition(newPos);
      
      setHistory([{
        tape: { ...tape },
        headPosition: newPos,
        currentState,
        action: null,
      }]);
      setHistoryIndex(0);
      setStepCount(0);
      setIsHalted(haltStates.has(currentState));
    }
  };

  const handleQuickTapeSet = () => {
    if (!isRunning) {
      const newTape = {};
      for (let i = 0; i < quickTapeInput.length; i++) {
        newTape[i] = quickTapeInput[i];
      }
      const newHeadPos = parseInt(quickHeadPos) || 0;
      setTape(newTape);
      setHeadPosition(newHeadPos);
      
      setHistory([{
        tape: { ...newTape },
        headPosition: newHeadPos,
        currentState,
        action: null,
      }]);
      setHistoryIndex(0);
      setStepCount(0);
      setIsHalted(false);
    }
  };

  const handleStateClick = (state) => {
    if (!isRunning) {
      setCurrentState(state);
      setIsHalted(haltStates.has(state));
      
      setHistory([{
        tape: { ...tape },
        headPosition,
        currentState: state,
        action: null,
      }]);
      setHistoryIndex(0);
      setStepCount(0);
    }
  };

  const handleToggleHalt = (state) => {
    if (!isRunning) {
      setHaltStates(prev => {
        const next = new Set(prev);
        if (next.has(state)) {
          next.delete(state);
        } else {
          next.add(state);
        }
        if (state === currentState) {
          setIsHalted(next.has(state));
        }
        return next;
      });
    }
  };

  const handleDeleteState = (state) => {
    if (!isRunning) {
      setStates(prev => prev.filter(s => s !== state));
      setHaltStates(prev => {
        const next = new Set(prev);
        next.delete(state);
        return next;
      });
    }
  };

  const handleTransitionUpdate = (key, newValue) => {
    setTransitions(prev => ({ ...prev, [key]: newValue }));
  };

  const handleTransitionDelete = (key) => {
    setTransitions(prev => {
      const newTransitions = { ...prev };
      delete newTransitions[key];
      return newTransitions;
    });
  };

  const handleTransitionAdd = (newTransition) => {
    const key = `${newTransition.state},${newTransition.symbol || BLANK}`;
    setTransitions(prev => ({
      ...prev,
      [key]: {
        write: newTransition.write || BLANK,
        move: newTransition.move,
        next: newTransition.next,
      }
    }));
    
    if (!states.includes(newTransition.state)) {
      setStates(prev => [...prev, newTransition.state]);
    }
    if (!states.includes(newTransition.next)) {
      setStates(prev => [...prev, newTransition.next]);
    }
  };

  const handleAddState = () => {
    if (newStateName && !states.includes(newStateName)) {
      setStates(prev => [...prev, newStateName]);
      setNewStateName('');
    }
  };

  const handleImport = (importedProgram) => {
    setProgram(importedProgram);
  };

  const getCurrentProgramData = () => ({
    name: 'Custom Program',
    description: 'Imported/Exported program',
    initialTape: quickTapeInput,
    startPosition: parseInt(quickHeadPos) || 0,
    states: states,
    initialState: currentState,
    haltStates: Array.from(haltStates),
    transitions: transitions,
  });

  const statesInTransitions = getStatesInTransitions();

  const visibleRange = 11;
  const halfRange = Math.floor(visibleRange / 2);
  const startIdx = headPosition - halfRange;

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid #393941',
    background: 'transparent',
    color: '#e9e9ea',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500,
  };

  const primaryButton = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
    border: 'none',
    color: '#fff',
  };

  const secondaryButton = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #8c7ae6 0%, #6c5ce7 100%)',
    border: 'none',
    color: '#fff',
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      style={{
        minHeight: '100vh',
        background: '#1a1a1c',
        color: '#e9e9ea',
        padding: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        outline: 'none',
      }}
    >
      {showTutorial && (
        <TutorialOverlay
          step={tutorialSteps[tutorialStep]}
          current={tutorialStep}
          total={tutorialSteps.length}
          onNext={() => setTutorialStep(s => s + 1)}
          onPrev={() => setTutorialStep(s => s - 1)}
          onClose={() => {
            setShowTutorial(false);
            setTutorialStep(0);
          }}
        />
      )}

      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        programData={getCurrentProgramData()}
        onImport={handleImport}
      />
      
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ 
              fontSize: 28, 
              marginBottom: 8,
              background: 'linear-gradient(135deg, #8c7ae6 0%, #e67e22 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Turing Machine Visualizer
            </h1>
            <p style={{ color: '#a1a1a8', fontSize: 14 }}>
              Watch how a Turing machine reads, writes, and moves — or build your own program
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip text="Import or export programs as JSON" position="bottom">
              <button
                onClick={() => setShowImportExport(true)}
                style={{
                  ...buttonStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📦 Import/Export
              </button>
            </Tooltip>
            <Tooltip text="Learn how Turing machines work with an interactive walkthrough" position="left">
              <button
                onClick={() => setShowTutorial(true)}
                style={{
                  ...secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📚 Tutorial
              </button>
            </Tooltip>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div>
            {/* Programs */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 8, 
                flexWrap: 'wrap',
              }}>
                <span style={{ color: '#666', fontSize: 12, marginRight: 4 }}>PROGRAMS:</span>
                {Object.entries(examplePrograms).map(([key, prog]) => (
                  <Tooltip key={key} text={prog.description} position="bottom">
                    <button
                      onClick={() => setProgram(prog)}
                      style={{
                        ...buttonStyle,
                        background: program.name === prog.name 
                          ? 'rgba(140, 122, 230, 0.2)' 
                          : 'transparent',
                        borderColor: program.name === prog.name ? '#8c7ae6' : '#393941',
                        fontSize: 11,
                        padding: '5px 10px',
                      }}
                    >
                      {prog.name}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Tape */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <div style={{
                  color: '#666',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  Infinite Tape
                  <HelpIcon tooltip="Click a cell to move the head there. Double-click to edit. Use ← → buttons to nudge the head." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tooltip text="Move head left" position="top">
                    <button
                      onClick={() => handleMoveHead(headPosition - 1)}
                      disabled={isRunning}
                      style={{
                        background: 'transparent',
                        border: '1px solid #393941',
                        borderRadius: 4,
                        color: isRunning ? '#555' : '#8c7ae6',
                        padding: '4px 10px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ← Head
                    </button>
                  </Tooltip>
                  <Tooltip text="Move head right" position="top">
                    <button
                      onClick={() => handleMoveHead(headPosition + 1)}
                      disabled={isRunning}
                      style={{
                        background: 'transparent',
                        border: '1px solid #393941',
                        borderRadius: 4,
                        color: isRunning ? '#555' : '#8c7ae6',
                        padding: '4px 10px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Head →
                    </button>
                  </Tooltip>
                </div>
              </div>
              
              <div style={{
                position: 'relative',
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ position: 'relative' }}>
                  <Head />
                </div>
                <div style={{
                  display: 'flex',
                  gap: 4,
                  transition: 'transform 0.3s ease',
                }}>
                  {Array.from({ length: visibleRange }, (_, i) => {
                    const idx = startIdx + i;
                    return (
                      <TapeCell
                        key={idx}
                        symbol={getTapeSymbol(idx)}
                        isHead={idx === headPosition}
                        isWriting={idx === headPosition && isWriting}
                        index={idx}
                        onEdit={handleTapeEdit}
                        onMoveHead={handleMoveHead}
                        disabled={isRunning}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 40,
                background: 'linear-gradient(90deg, #27272a 0%, transparent 100%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 40,
                background: 'linear-gradient(-90deg, #27272a 0%, transparent 100%)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Quick Tape Input */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ 
                fontSize: 12, 
                color: '#666', 
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
              }}>
                Quick Tape Input
                <HelpIcon tooltip="Type tape contents and head position, then click Set to initialize the tape quickly." />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={quickTapeInput}
                  onChange={(e) => setQuickTapeInput(e.target.value)}
                  placeholder="Tape contents (e.g., 1011)"
                  disabled={isRunning}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#1a1a1c',
                    border: '1px solid #393941',
                    borderRadius: 6,
                    color: '#e9e9ea',
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
                <Tooltip text="Head starting position (cell index)" position="top">
                  <input
                    value={quickHeadPos}
                    onChange={(e) => setQuickHeadPos(e.target.value)}
                    placeholder="Pos"
                    disabled={isRunning}
                    style={{
                      width: 60,
                      padding: '8px 12px',
                      background: '#1a1a1c',
                      border: '1px solid #393941',
                      borderRadius: 6,
                      color: '#e67e22',
                      fontSize: 14,
                      fontFamily: 'monospace',
                      textAlign: 'center',
                    }}
                  />
                </Tooltip>
                <button
                  onClick={handleQuickTapeSet}
                  disabled={isRunning}
                  style={{
                    padding: '8px 16px',
                    background: '#4ade80',
                    border: 'none',
                    borderRadius: 6,
                    color: '#1a1a1c',
                    fontWeight: 'bold',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.5 : 1,
                  }}
                >
                  Set
                </button>
              </div>
            </div>

            {/* Controls */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!isRunning ? (
                    <Tooltip text="Run continuously until halt (Enter)" position="bottom">
                      <button onClick={handleRun} style={primaryButton} disabled={isHalted}>
                        ▶ Run
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip text="Pause execution (Enter)" position="bottom">
                      <button onClick={handlePause} style={secondaryButton}>
                        ⏸ Pause
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip text="Execute one step (Space)" position="bottom">
                    <button onClick={handleStep} style={buttonStyle} disabled={isRunning || isHalted}>
                      → Step
                    </button>
                  </Tooltip>
                  <Tooltip text="Reset to initial state (R)" position="bottom">
                    <button onClick={handleReset} style={{...buttonStyle, borderColor: '#e25f73', color: '#e25f73'}}>
                      ↺ Reset
                    </button>
                  </Tooltip>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tooltip text="Adjust execution speed" position="left">
                    <span style={{ fontSize: 12, color: '#a1a1a8', cursor: 'help' }}>Speed:</span>
                  </Tooltip>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    value={1050 - speed}
                    onChange={(e) => setSpeed(1050 - Number(e.target.value))}
                    style={{ width: 80 }}
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                padding: 12,
                background: '#232334',
                borderRadius: 6,
              }}>
                <Tooltip text="The machine's current mode of operation" position="top">
                  <div style={{ cursor: 'help' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>STATE</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#8c7ae6' }}>
                      {currentState}
                    </div>
                  </div>
                </Tooltip>
                <Tooltip text="The tape cell index where the HEAD is located" position="top">
                  <div style={{ cursor: 'help' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>POSITION</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e67e22' }}>
                      {headPosition}
                    </div>
                  </div>
                </Tooltip>
                <Tooltip text="Number of transition rules executed" position="top">
                  <div style={{ cursor: 'help' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>STEPS</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4ade80' }}>
                      {stepCount}
                    </div>
                  </div>
                </Tooltip>
                <Tooltip text={isHalted ? "Machine has reached a halt state" : isRunning ? "Machine is executing" : "Ready to run"} position="top">
                  <div style={{ cursor: 'help' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>STATUS</div>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 'bold', 
                      color: isHalted ? '#4ade80' : isRunning ? '#60a5fa' : '#a1a1a8' 
                    }}>
                      {isHalted ? '✓ HALTED' : isRunning ? '● RUNNING' : '○ READY'}
                    </div>
                  </div>
                </Tooltip>
              </div>

              {lastAction && lastAction.type === 'step' && (
                <div style={{
                  marginTop: 12,
                  padding: 10,
                  background: 'rgba(140, 122, 230, 0.1)',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#a1a1a8',
                }}>
                  Read <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{lastAction.read}</span>
                  {' → '}
                  Write <span style={{ color: '#f472b6', fontWeight: 'bold' }}>{lastAction.write}</span>
                  {', Move '}
                  <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                    {lastAction.move === 'R' ? 'Right →' : '← Left'}
                  </span>
                  {', Goto '}
                  <span style={{ color: '#8c7ae6', fontWeight: 'bold' }}>{lastAction.to}</span>
                </div>
              )}
            </div>

            {/* History & Log */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{ 
                fontSize: 12, 
                color: '#666', 
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
              }}>
                History & Execution Log
                <HelpIcon tooltip="Use ←/→ keys or slider to navigate. Click any log entry to jump to that step. Home/End to jump to start/finish." />
              </div>
              <HistorySlider
                history={history}
                currentIndex={historyIndex}
                onSeek={handleSeek}
                disabled={isRunning}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666', textAlign: 'center' }}>
                Step {historyIndex} of {Math.max(0, history.length - 1)}
              </div>
              <div style={{ marginTop: 12 }}>
                <ExecutionLog
                  history={history}
                  currentIndex={historyIndex}
                  onSeek={handleSeek}
                />
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div>
            {/* Keyboard shortcuts */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 11,
            }}>
              <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Keyboard Shortcuts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', color: '#a1a1a8' }}>
                <span><kbd style={{ background: '#393941', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>Space</kbd> Step</span>
                <span><kbd style={{ background: '#393941', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>Enter</kbd> Run/Pause</span>
                <span><kbd style={{ background: '#393941', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>R</kbd> Reset</span>
                <span><kbd style={{ background: '#393941', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>←→</kbd> History</span>
              </div>
            </div>

            {/* States */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ 
                fontSize: 12, 
                color: '#666', 
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
              }}>
                States
                <HelpIcon tooltip="☑ = halt state (machine stops). Click a state to set it as current. × to delete unused states." />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {states.map(s => (
                  <StateNode
                    key={s}
                    state={s}
                    isCurrent={s === currentState}
                    isHalt={haltStates.has(s)}
                    isInTransitions={statesInTransitions.has(s)}
                    onToggleHalt={handleToggleHalt}
                    onDelete={handleDeleteState}
                    onClick={handleStateClick}
                    disabled={isRunning}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="New state name"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: '#1a1a1c',
                    border: '1px solid #393941',
                    borderRadius: 4,
                    color: '#e9e9ea',
                    fontSize: 12,
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddState()}
                />
                <Tooltip text="Add a new state" position="left">
                  <button
                    onClick={handleAddState}
                    style={{
                      padding: '6px 12px',
                      background: '#4ade80',
                      border: 'none',
                      borderRadius: 4,
                      color: '#1a1a1c',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Add
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Transition Editor */}
            <div style={{
              background: '#27272a',
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{ 
                fontSize: 12, 
                color: '#666', 
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
              }}>
                Transition Editor
                <HelpIcon tooltip="Each rule: if in STATE reading SYMBOL → WRITE symbol, MOVE head, go to NEXT state. Highlighted row executes next." />
              </div>
              <TransitionEditor 
                transitions={transitions}
                states={states}
                onUpdate={handleTransitionUpdate}
                onDelete={handleTransitionDelete}
                onAdd={handleTransitionAdd}
                currentState={currentState}
                currentSymbol={getTapeSymbol(headPosition)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          padding: 20,
          background: '#27272a',
          borderRadius: 8,
          fontSize: 13,
          color: '#a1a1a8',
          lineHeight: 1.6,
        }}>
          <h3 style={{ color: '#8c7ae6', marginBottom: 12, fontSize: 16 }}>
            Understanding Turing Machines
          </h3>
          <p style={{ marginBottom: 12 }}>
            A Turing machine has three parts: an <strong style={{ color: '#e9e9ea' }}>infinite tape</strong> (memory), 
            a <strong style={{ color: '#e9e9ea' }}>head</strong> (reads/writes one cell at a time), and a 
            <strong style={{ color: '#e9e9ea' }}> state machine</strong> (the program logic).
          </p>
          <p style={{ marginBottom: 12 }}>
            Each step follows one rule: <span style={{ color: '#4ade80' }}>read</span> the current cell → 
            <span style={{ color: '#f472b6' }}> write</span> a new symbol → 
            <span style={{ color: '#60a5fa' }}> move</span> left or right → 
            <span style={{ color: '#8c7ae6' }}> change state</span>. That's it!
          </p>
          <p>
            The <strong style={{ color: '#e67e22' }}>Church-Turing thesis</strong> states that this simple machine 
            can compute anything computable. Your laptop? Fundamentally just a very fast Turing machine with finite 
            (but large) tape.
          </p>
        </div>
      </div>
    </div>
  );
}
