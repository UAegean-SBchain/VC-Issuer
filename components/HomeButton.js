import Link from "next/link";
import { Button } from "react-bootstrap";

const HomeButton = props => {
  const message = props.text?props.text:"Αρχική Σελίδα"
  
  return (
    <div className="col" style={{ marginTop: "1.5rem" }}>
      <Link href={props.baseUrl ? `${props.baseUrl}` : "/"}>
        <Button variant="primary" className="float-right">
          {message}
        </Button>
      </Link>
    </div>
  );
};

export default HomeButton;
