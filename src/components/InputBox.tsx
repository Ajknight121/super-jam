import { useState, useContext, useEffect } from "react";

export default function InputBox({ typeName, purposeCategory, index }) {
  const { updateResponse, responses } = useContext(SurveyContext);
  const { mouseDown, addItem, selected, isIncluded, removeItem, mouseDownState, multi,setStart, addingRef } = useContext(SelectContext);

  const self = {typeName, purposeCategory};

  // input box has the default state of being green (0)
  const [level, setLevel] = useState(-1);

  const [tempHighlight, setTempHighlight] = useState(false);
  const [tempOff, setTempOff] = useState(false);
  // Update from survey data if available
  useEffect(() => {
    if (responses && responses[typeName] && responses[typeName][purposeCategory] !== undefined) {
      const surveyValue = responses[typeName][purposeCategory];
      if (surveyValue !== -1) {
        setLevel(surveyValue);
      }
    }
  }, [responses, typeName, purposeCategory]);

  useEffect(() => {
    setTempHighlight(false);
    setTempOff(false);
  }, [selected])

  // Clicks occur after mouse up event
  const handleClick = () => {
    if (!multi && addingRef.current) {
      // select which color is going to transition on click: 0 (green) -> 1 (orange) -> 2 (red) -> 0 (green)
      const newLevel = (level + 1) % 3;
  
      // survey value update
      updateResponse(typeName, purposeCategory, newLevel);
      removeItem(self)
      setTempHighlight(false);
      setStart(null)
      return;
    }

    if (isIncluded(self) && !addingRef.current) {
      removeItem(self);
    } else if (addingRef.current) {
      addItem(self)
    }

  };

  const getColor = (level) => {
    if (level === 0) {
      return "green";
    } else if (level === 1) {
      return "orange";
    } else if (level === 2) {
      return "red";
    }
    return "grey";
  };

  const handleMouseDown = (e) => {
    mouseDown.current = true;
    setStart(self)
    if (!isIncluded(self)) {
      addingRef.current = true;
      setTempHighlight(true);
    } else {
      addingRef.current = false;
      setTempOff(true);
    }
  };

  const handleMouseUp = () => {
    mouseDown.current = false;
  };

  const handleMouseEnter = () => {
    if (mouseDown.current && mouseDownState) {
      if (!isIncluded(self) && addingRef.current == true) {
        addItem(self);
      } else if (addingRef.current == false) {
        removeItem(self)
      }
    }
  }

  return (
    <div
      className={"input-box " + `${tempHighlight} ${tempHighlight || (!tempOff && isIncluded(self)) ? "selected" : ""}`}
      style={{ backgroundColor: getColor(level) }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
    >
      {index}
    </div>
  );
}
