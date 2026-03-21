export default function Hero() {
    return (
        <div className="hero">
            <h1><span className="bracket">[</span>Defrost<span className="bracket">]</span></h1>
            <p className="tagline">Morning frost alerts for your car</p>
            <p className="hero-desc">
                Wake up ready. Defrost checks tomorrow's overnight low and sends you an email alert when your car needs defrosting so you're never caught off guard on a cold morning. 🌡️
            </p>
            <div className="authors">
                <p className="authors-label">Built by</p>
                <div className="authors-row">
                    <div className="author-circle">
                        <span className="author-initial">R</span>
                        <span className="author-name">Rudolf</span>
                    </div>
                    <div className="author-circle">
                        <span className="author-initial">N</span>
                        <span className="author-name">Nathan</span>
                    </div>
                    <div className="author-circle">
                        <span className="author-initial">A</span>
                        <span className="author-name">Abdi</span>
                    </div>
                </div>
            </div>
        </div>
    )
}