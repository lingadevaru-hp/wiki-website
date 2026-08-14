export default function WikiFooter() {
  return (
    <footer className="border-t border-border mt-8 py-4 px-4 text-xs text-muted-foreground">
      <div className="max-w-[1400px] mx-auto">
        <p className="mb-2">
          Text is available under the{' '}
          <a href="#" className="text-accent hover:underline">Creative Commons Attribution-ShareAlike License 4.0</a>;
          additional terms may apply. By using this site, you agree to the Terms of Use and Privacy Policy.
          Aethelgard Codex is a fictional encyclopedia hosted on the Replit platform.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Disclaimers</a>
          <a href="#" className="hover:underline">Contact us</a>
          <a href="#" className="hover:underline">Privacy policy</a>
          <a href="#" className="hover:underline">Cookie statement</a>
          <a href="#" className="hover:underline">Mobile view</a>
        </div>
      </div>
    </footer>
  );
}
