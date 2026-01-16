import React from "react";
import "./ToggleField.scss";

export default function ToggleField({ value, handler, label, help }) {
  return (
    <div className="fieldCheck">
      <label className="custom-toggle" style={{}}>
        <input type="checkbox" checked={value} onChange={handler} style={{marginLeft:50, fontSize:12}} />
        <span className="slider" style={{fontSize:12}}/>
        <div className="fieldInfo">
          <span style={{fontSize:12}}>{label}</span>
          <div className="fieldHelp" style={{fontSize:12, width: 100}}>{help}</div>
        </div>
      </label>
    </div>
  );
}







// import React from "react";
// import Toggle from "react-toggle";
// import "./ToggleField.scss";

// export default function ToggleField(props) {
//   return (
//     <div className="fieldCheck">
//       <label>
//         <Toggle
//           defaultChecked={props.value}
//           icons={false}
//           onChange={props.handler}
//         />
//         <div className="fieldInfo">
//           <span>{props.label}</span>
//           <div className="fieldHelp">{props.help}</div>
//         </div>
//       </label>
//     </div>
//   );
// }
