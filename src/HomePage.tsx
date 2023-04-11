import { Button, Card, Container, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import logo from "./static/img/logo.png";
import Thay1 from "./static/img/Thay-nam-kiet-tuong-750x430.jpg";
import Thay2 from "./static/img/Thay-ngoi-thien-Tam-Bat-Dong-750x430.jpg";
import Thay3 from "./static/img/Thay-tham-lai-Hon-Son-2012-750x430.jpg";

export function Header() {
  return (
    <Nav
      activeKey="/home"
      onSelect={(selectedKey) => {
        // alert(`selected ${selectedKey}`
      }}
      style={{ minHeight: "3rem", marginTop: "0.5rem" }}
    >
      <Nav.Item>
        <Nav.Link href={`${process.env.PUBLIC_URL}/`}>
          <img
            src={logo}
            width="32px"
            height="32px"
            style={{ cursor: "pointer" }}
          />
        </Nav.Link>
      </Nav.Item>

      <Nav.Item>
        <Nav.Link href="/home">Active</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-1">Link</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-2">Link</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="disabled" disabled>
          Disabled
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Container>
      <Header />
      <div className="d-flex justify-content-center gap-3">
        {/** Tri Kiến Giải Thoát */}
        <Card>
          <Card.Img variant="top" src={Thay1} />
          <Card.Body>
            <Card.Title>Tri Kiến Giải Thoát</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              Lớp Chánh Kiến
            </Card.Subtitle>
            <Button
              className="w-100"
              variant="light"
              onClick={() =>
                navigate(`${process.env.PUBLIC_URL}/tri-kien-giai-thoat`)
              }
            >
              Truy Cập
            </Button>
          </Card.Body>
        </Card>

        {/** Pháp Hành */}
        <Card>
          <Card.Img variant="top" src={Thay2} />
          <Card.Body>
            <Card.Title>Pháp Hành</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              Lớp Chánh Định
            </Card.Subtitle>
            <Button
              className="w-100"
              variant="light"
              onClick={() => navigate(`${process.env.PUBLIC_URL}/phap-hanh`)}
            >
              Truy Cập
            </Button>
          </Card.Body>
        </Card>

        {/** Sách Nói */}
        <Card>
          <Card.Img variant="top" src={Thay3} />
          <Card.Body>
            <Card.Title>Sách Nói</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              Thư Viện Tổng Hợp
            </Card.Subtitle>
            <Button
              className="w-100"
              variant="light"
              onClick={() => {
                debugger;
                navigate(`${process.env.PUBLIC_URL}/sach-noi`);
              }}
            >
              Truy Cập
            </Button>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}
