import { useEffect, useState } from "react";

function CalendarDay({ day, isSelected, onClick }) {
  const dayOfMonth = day ? new Date(day + "T00:00:00Z").getUTCDate() : null;
  return (
    <div
      className={`cm-cell ${day ? "" : "empty"} ${isSelected ? "selected-day" : ""}`}
    >
      {day ? (
        <button
          type="button"
          className="date-btn"
          onClick={() => onClick(day)}
          aria-pressed={isSelected}
        >
          {dayOfMonth}
        </button>
      ) : null}
    </div>
  );
}

export default function Calendar({
  month: initialMonth,
  year: initialYear,
  name = "selectedDate",
  selectedDays,
  setSelectedDays,
}) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1); // 1..12
  const [year, setYear] = useState(initialYear ?? now.getFullYear());

  function handleClick(day) {
    if (selectedDays.includes(day)) {
      const newArray = selectedDays.filter((c) => {
        return c !== day;
      });
      setSelectedDays(newArray);
    } else {
      setSelectedDays([...selectedDays, day]);
    }
    console.log(day);
  }

  useEffect(() => {
    if (initialMonth) setMonth(initialMonth);
    if (initialYear) setYear(initialYear);
  }, [initialMonth, initialYear]);

  function buildWeeks(y, m) {
    const first = new Date(y, m - 1, 1);
    const firstWeekday = first.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(y, m, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(y, m - 1, d));
      cells.push(date.toISOString().slice(0, 10)); // YYYY-MM-DD
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  function prevMonth() {
    let m = month - 1;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setMonth(m);
    setYear(y);
  }

  function nextMonth() {
    let m = month + 1;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weeks = buildWeeks(year, month);

  // format selected date as YYYY-MM-DD for form submission
  const formattedSelected = selectedDays[0] || "";

  return (
    <section
      className="cm-calendar"
      aria-label={`Calendar ${monthNames[month - 1]} ${year}`}
      data-month={month}
      data-year={year}
    >
      <header className="cm-cal-header">
        <button
          className="arrow prev"
          aria-label="Previous month"
          type="button"
          onClick={prevMonth}
        >
          &lt;
        </button>
        <div className="title" aria-live="polite">
          {monthNames[month - 1]} {year}
        </div>
        <button
          className="arrow next"
          aria-label="Next month"
          type="button"
          onClick={nextMonth}
        >
          &gt;
        </button>
      </header>

      <div className="cm-weekdays" aria-hidden="true">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
      </div>

      <div className="cm-grid" aria-hidden="false">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const isSelected = day && selectedDays.includes(day);
            return (
              <CalendarDay
                day={day}
                isSelected={isSelected}
                onClick={handleClick}
                key={wi + "-" + di}
              />
            );
          }),
        )}
      </div>

      {/* hidden field so forms can pick up selected date */}
      <input type="hidden" name={name} value={formattedSelected} readOnly />

      <style>{`
        .cm-calendar {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 6px 10px rgba(0,0,0,0.06);
          padding: 12px 18px 18px 18px;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .cm-cal-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 6px 2px;
          margin-bottom: 6px;
        }
        .cm-cal-header .title {
          font-weight:700;
          text-align:center;
          flex:1;
          color:#333;
        }
        .cm-cal-header .arrow {
          background:transparent;
          border:none;
          font-size:18px;
          width:36px;
          height:36px;
          border-radius:8px;
          cursor:pointer;
          color:#777;
        }
        .cm-weekdays {
          display:grid;
          grid-template-columns: repeat(7, 1fr);
          font-size:12px;
          color:#a0a0a0;
          text-align:center;
          margin-bottom:6px;
        }
        .cm-grid {
          display:grid;
          grid-template-columns: repeat(7, 1fr);
          gap:6px;
        }
        .cm-cell {
          min-height:36px;
          display:flex;
          align-items:flex-start;
          justify-content:center;
          border-radius:8px;
          background:transparent;
        }
        .cm-cell.empty {
          opacity:0.15;
        }
        .date-btn {
          background:transparent;
          border:0;
          padding:6px 8px;
          border-radius:8px;
          font-size:14px;
          color:#333;
          cursor:pointer;
        }
        .date-btn:hover { background:#f3f3f3; }
        .cm-cell.selected-day .date-btn {
          background: #e6e6e6;
          box-shadow: inset 0 0 0 2px rgba(0,0,0,0.02);
        }
      `}</style>
    </section>
  );
}
